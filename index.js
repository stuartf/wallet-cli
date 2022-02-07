require("dotenv").config();
const axios = require("axios");
const express = require("express");
const https = require("https");
const { AuthorizationCode } = require("simple-oauth2");
const { argv } = require("process");
const { createIssuer } = require("@digitalcredentials/sign-and-verify-core");
const { driver } = require("@digitalcredentials/did-method-key");
const { exec } = require("child_process");
const { URL } = require("url");

const oauthConfig = {
  client: {
    id: "demo",
  },
  auth: {
    tokenHost: "https://oauth.127.0.0.1.nip.io",
  },
  http: {
    rejectUnauthorized: false,
  },
};

const client = new AuthorizationCode(oauthConfig);
const app = express();
const port = process.env.PORT || 3000;

const deepLink = new URL(argv[2]);
const challenge = deepLink.searchParams.get("challenge");
const requestEndpoint = deepLink.searchParams.get("vc_request_url");

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
    redirect_uri: `http://localhost:${port}/callback`,
    scope: ["openid", "profile"],
  });
  exec(`xdg-open '${authorizationUri}'`).unref();
};

app.get("/callback", async (req, res) => {
  const { code } = req.query;
  const tokenParams = {
    code,
    redirect_uri: "dccrequest://oauth",
    scope: ["openid", "profile"],
  };

  const { token } = await client.getToken(tokenParams);
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
  return res.send(
    await axios.post(requestEndpoint, presentation, {
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    })
  );
});

app.listen(port, () => {
  run();
});
