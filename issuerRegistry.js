const port = process.env.PORT || 3000;

module.exports = {
  meta: {
    created: "2021-12-15T18:41:36+0000",
    updated: "2021-12-20T10:47:36+0000",
  },
  entries: {
    "https://oauth.127.0.0.1.nip.io/default": {
      issuer: "https://oauth.127.0.0.1.nip.io/default",
      clientId: "demo",
      redirectUrl: `http://localhost:${port}/callback`,
      scopes: ["openid"],
      serviceConfiguration: {
        authorizationEndpoint:
          "https://oauth.127.0.0.1.nip.io/default/authorize",
        tokenEndpoint: "https://oauth.127.0.0.1.nip.io/default/token",
      },
    },
    "issuer.example.com": {
      issuer: "https://accounts.google.com",
      clientId:
        "64590692238-if1jf1fco72srsgjc1ged8tm8106fcpc.apps.googleusercontent.com",
      redirectUrl:
        "com.googleusercontent.apps.64590692238-if1jf1fco72srsgjc1ged8tm8106fcpc:/oauth2redirect/google",
      scopes: ["openid", "profile"],
    },
    "https://rc.xpro.mit.edu": {
      issuer: "https://rc.xpro.mit.edu",
      clientId: "l5pbLVALWD89VwfS8IsozXRI5yftHo1fpMJgWP53",
      serviceConfiguration: {
        authorizationEndpoint: "https://rc.xpro.mit.edu/oauth2/authorize/",
        tokenEndpoint: "https://rc.xpro.mit.edu/oauth2/token/",
      },
      redirectUrl: "dccrequest://oauth",
      scopes: ["digitalcredentials"],
    },
    "https://sso.gatech.edu/cas/oidc": {
      issuer: "https://sso.gatech.edu/cas/oidc",
      serviceConfiguration: {
        authorizationEndpoint: "https://sso.gatech.edu/cas/oidc/authorize",
        tokenEndpoint: "https://sso.gatech.edu/cas/oidc/accessToken",
        revocationEndpoint: "https://sso.gatech.edu/cas/oidc/revoke",
        registrationEndpoint: "https://sso.gatech.edu/cas/oidc/register",
      },
      clientId: "704d4928-2680-42d0-ad10-30063fa70a0b",
      scopes: ["openid", "profile"],
      redirectUrl: "dccrequest://oauth",
    },
    "https://login.microsoftonline.com/7e153a68-2c14-45b5-aabd-890731981795": {
      issuer:
        "https://login.microsoftonline.com/7e153a68-2c14-45b5-aabd-890731981795",
      clientId: "68d1183f-7a92-40a3-8be1-d0a5d46d9087",
      scopes: [
        "https://mcmasteresol.onmicrosoft.com/verifiable_credentials/Credentials.Issue",
      ],
      redirectUrl: "dccrequest://oauth",
    },
  },
};
