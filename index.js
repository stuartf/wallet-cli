require("dotenv").config();
const axios = require("axios");
const base64url = require("base64url");
const crypto = require("crypto");
const express = require("express");
const https = require("https");
const { AuthorizationCode } = require("simple-oauth2");
const { argv } = require("process");
const { createIssuer } = require("@digitalcredentials/sign-and-verify-core");
const { driver } = require("@digitalcredentials/did-method-key");
const { exec } = require("child_process");
const { URL } = require("url");
const issuerRegistry = require("./issuerRegistry");

const codeVerifier = crypto.randomBytes(25).toString("hex");
const codeChallenge = base64url.encode(
  crypto.createHash("sha256").update(codeVerifier).digest()
);

const app = express();
const port = process.env.PORT || 3000;

const deepLink = new URL(argv[2]);
const challenge = deepLink.searchParams.get("challenge");
const requestEndpoint = deepLink.searchParams.get("vc_request_url");
const issuer = deepLink.searchParams.get("issuer");
const issuerConfig = issuerRegistry.entries[issuer];
const authUrl = new URL(
  issuerConfig.serviceConfiguration.authorizationEndpoint
);
const tokenUrl = new URL(issuerConfig.serviceConfiguration.tokenEndpoint);

const oauthConfig = {
  client: {
    id: issuerConfig.clientId,
  },
  auth: {
    authorizeHost: authUrl.origin,
    authorizePath: authUrl.pathname,
    tokenHost: tokenUrl.origin,
    tokenPath: tokenUrl.pathname,
  },
  http: {
    rejectUnauthorized: false,
  },
};

const client = new AuthorizationCode(oauthConfig);

const privatizeDidDoc = (didDocument, getMethodForPurpose) => {
  const didDocumentClone = JSON.parse(JSON.stringify(didDocument));
  const purposes = [
    "authentication",
    "assertionMethod",
    "verificationMethod",
    "capabilityDelegation",
    "capabilityInvocation",
    "keyAgreement",
  ];
  purposes.forEach((purpose) => {
    const methodForPurpose = getMethodForPurpose({ purpose });
    didDocumentClone[purpose][0] = JSON.parse(JSON.stringify(methodForPurpose));
  });
  return didDocumentClone;
};

const getDidDocFromSeed = async (seed) => {
  const didSeedBytes = new TextEncoder().encode(seed).slice(0, 32);
  const { didDocument, methodFor } = await driver().generate({
    seed: didSeedBytes,
  });
  const publicDoc = JSON.parse(JSON.stringify(didDocument));
  const privateDoc = privatizeDidDoc(didDocument, methodFor);

  return { publicDoc, privateDoc };
};

const run = async () => {
  const authorizationUri = client.authorizeURL({
    redirect_uri: issuerConfig.redirectUrl,
    scope: issuerConfig.scopes,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  exec(`xdg-open '${authorizationUri}'`).unref();
};

app.get("/callback", async (req, res) => {
  const { code } = req.query;
  const tokenParams = {
    code,
    redirect_uri: "dccrequest://oauth",
    scope: issuerConfig.scopes,
    code_verifier: codeVerifier,
  };

  const { token } = await client.getToken(tokenParams);
  const accessToken = token.access_token;
  const { publicDoc, privateDoc } = await getDidDocFromSeed(
    process.env.DID_SEED
  );
  const { createAndSignPresentation } = createIssuer([privateDoc]);
  const verificationMethod = publicDoc.verificationMethod[0].id;
  const presentation = await createAndSignPresentation(
    null,
    `demo-${publicDoc.id}-${challenge}`,
    publicDoc.id,
    { challenge, verificationMethod }
  );
  try {
    const cred = await axios
      .post(requestEndpoint, presentation, {
        headers: { Authorization: `Bearer ${accessToken}` },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      })
      .then(({ data }) => data);
    console.log(cred);
    return res.send(cred);
  } catch (err) {
    console.log(err.toJSON());
    return res.status(500).send(err.toJSON());
  } finally {
    process.exit();
  }
});

app.listen(port, () => {
  run();
});
