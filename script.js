const settings = {
  slackWebhookURL: 'YOUR_SLACK_WEBHOOK_URL',
};

function delegateChores() {
  // Get the current date
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();

  // PRNG adaptation by Antti Kissaniemi/JasonWoof, Stackexchange
  // https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
  /* PRNG begin */
  const m_w = 123456789;
  const m_z = 987654321;
  const mask = 0xffffffff;

  // Takes any integer (best: between 0 and 2^32-1)
  function seed(i) {
    m_w = i;
    m_z = 987654321;
  }

  // Returns number between 0 (inclusive) and 1.0 (exclusive),
  // just like Math.random().
  function random_prng() {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    const result = ((m_z << 16) + m_w) & mask;
    result /= 4294967296;
    return result + 0.5;
  }
  /* PRNG end */

  // Seed PRNG with a javascript pseudorandom number plus the current milisecond
  seed_val = (Math.floor(Math.random() * (mask + 1)) + today.getMilliseconds()) & mask;
  seed(seed_val);

  // Get the spreadsheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get the list of people
  const s_people = ss.getSheetByName('people');
  const people = s_people.getDataRange().getValues();

  // Get the list of chores
  const s_chores = ss.getSheetByName('chores');
  const chores = s_chores.getDataRange().getValues();

  // Get the list of people (indices) that have done something already
  const s_write = ss.getSheetByName('state');
  const r_write = s_write.getDataRange();
  const data_write = r_write.getValues();
  let assigned;
  if (data_write[0][0] === '') {
    assigned = [];
  } else {
    assigned = data_write[0];
  }

  Logger.log(`Read index list: ${assigned}`);

  // Return a random person index that hasn't been chosen yet
  function uniqueRandPerson(arr) {
    let e;

    // Only run this loop if there are still people left to choose from
    if (arr.length < people.length) {
      do {
        e = Math.floor(random_prng() * people.length);
        // Logger.log(e);
      } while (arr.indexOf(e) !== -1);
    } else {
      // Return -1 if everyone has already been chosen
      e = -1;
    }

    return e;
  }

  function returnPerson() {
    const tmp = assigned.slice(); // deep copy
    // Grab a random person index
    let rand_person;

    do {
      rand_person = uniqueRandPerson(tmp);

      if (rand_person === -1) {
        break;
      }

      Logger.log(`chosen random pers: ${rand_person}`);
      tmp.push(rand_person);
    } while ((people[rand_person][1] === 'monday' && dayOfWeek === 1) || (people[rand_person][1] === 'tuesday' && dayOfWeek === 2) || (people[rand_person][1] === 'wednesday' && dayOfWeek === 3) || (people[rand_person][1] === 'thursday' && dayOfWeek === 4) || (people[rand_person][1] === 'friday' && dayOfWeek === 5));
    Logger.log(`Ended choice with: ${rand_person}`);
    return rand_person;
  }

  const assigned_new = [];
  // Loop through the chores, everything needs to get done!
  for (let i = 0; i < chores.length; i += 1) {
    let rand_person;

    // If the chore is blank or we are not supposed to do it today, move along
    if (chores[i][0] === '' || (chores[i][1] === 'daily' && (dayOfWeek === 0 || dayOfWeek === 6)) || (chores[i][1] === 'monday' && dayOfWeek !== 1) || (chores[i][1] === 'tuesday' && dayOfWeek !== 2) || (chores[i][1] === 'wednesday' && dayOfWeek !== 3) || (chores[i][1] === 'thursday' && dayOfWeek !== 4) || (chores[i][1] === 'friday' && dayOfWeek !== 5)) {
      continue;
    }

    rand_person = returnPerson();

    // If everyone has been once, reset list
    if (rand_person === -1) {
      Logger.log('Resetting list!');
      assigned = assigned_new.slice(); // Copy people chosen so far this time
      rand_person = returnPerson();
    }

    if (rand_person !== -1) {
      // Executor
      assign(people[rand_person][0], chores[i][0]);

      // Add the assignee to the assigned array so they don't get chosen again
      assigned.push(rand_person);
      assigned_new.push(rand_person); // for if we have to reset
    } else {
      Logger.log('There are more chores than people and this happened twice!');
    }
  }

  // Write out current list
  r_write.deleteCells(SpreadsheetApp.Dimension.ROWS); // delete current list
  Logger.log(`New index list: ${assigned}`);
  const new_r_write = s_write.getRange(1, 1, 1, assigned.length);
  data_write = [assigned];
  new_r_write.setValues(data_write);
}

const payload = {
  link_names: 1,
};

const opts = {
  method: 'post',
  contentType: 'application/json',
};

// Send a message to the #chores slack channel, assigning a @user to a chore.
function assign(user, chore) {
  const msg = `<@${user}>, ${chore}`;
  talk(msg);
}

// Utility fn to send an ad hoc message as Rosie
function talk(msg) {
  payload.text = msg;
  opts.payload = JSON.stringify(payload);

  Logger.log(payload.text);

  result = UrlFetchApp.fetch(settings.slackWebhookURL, opts);
}
