# slack-sheets-cleaning-webhook

A chorebot webhook script for slack. "Randomly" assign chores to people working in your office

### Setup
- Create a new Google sheets document.
- Create 3 tabs / pages; called `people`, `chores`, and `state`.
- In the `people` page use the first column for unique user ids `UXXXXXXXX`. The second column can be used for a single day that user gets ignored, ie `friday`. No other columns are required, but I use the third for the user's name.
- In the `chores` page setup your chores. The first column is the chore message. The second column is the frequency of the chore; put either `daily` or a day, ie `friday`. If you need the task to be on both Monday and Wednesday, list the task twice.
- Leave the `state` page empty.
- In Google Sheets open the script editor (Tools > Script Editor) and place the script.js file in there.
- Change the `slackWebhookURL` to your URL.
- Setup a trigger for the `delegateChores` function. Google can do this internally. Set it for daily, early in the morning.