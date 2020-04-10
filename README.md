# Bkper Bot

A Bkper Bot execute as [remote Google Apps Script functions](https://developers.google.com/apps-script/api/how-tos/execute), authenticated via OAuth2, thus requiring a [standard Cloud Platform project](https://developers.google.com/apps-script/guides/cloud-platform-projects#standard_cloud_platform_projects)

Bkper handles the OAuth2 flow as well as its access token management.

## Creting new Bot

### Google Cloud setup

- <a href='https://script.google.com/create' target='_blank'>Create a new Google Apps Script project.</a>
- <a href='https://console.cloud.google.com/projectcreate' target='_blank'>Create a new Google Cloud Platform project</a>.
- [Enable Apps Script API](https://console.cloud.google.com/apis/library/script.googleapis.com) on the GCP project
- [Configure the OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
  - Add ```bkper.com``` authorized domain.
- [Bind the Cloud Platform project](https://developers.google.com/apps-script/guides/cloud-platform-projects#switching_to_a_different_standard_gcp_project) to the Apps Script project.
- [Create an OAuth Credential](https://console.cloud.google.com/apis/credentials/oauthclient) of type "Web Application"
  - Add the Authorized redirect URI ```https://app.bkper.com/connections/google/oauth2callback```
  - Store the Client ID (sheets for now)
  - Store the Client Secret (sheets for now)
- [Create an API Key](https://console.cloud.google.com/apis/credentials/key) 
  - Restrict the HTTP referrers to ```bkper.com```
  - Store the API key (sheets for now)
  - On the created Script, set a Script Property with name 'API_KEY' and store the API Key value

### Bot development setup

- Create a Github Project from this template
- Update the SCRIPT_ID on ```.clasp.json``` with the id of the script you just created
- Update the project name and the DEPLOYMENT_ID on ```package.json```



## Publishing a Bot