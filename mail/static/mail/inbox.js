document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('compose'));

  // By default, load the inbox
  load_mailbox('inbox');

  const form = document.querySelector('#compose-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const recipients = document.querySelector('#compose-recipients');
    const subject = document.querySelector('#compose-subject');
    const body = document.querySelector('#compose-body');

    await fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients.value,
        subject: subject.value,
        body: body.value,
      })
    });

    showNotif('Successfully sent the email', 'success');
    load_mailbox('sent');
  });
});

function compose_email(typeOfEmail, mail = null) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  const header = document.querySelector('#compose-view > h3');
  const recipients = document.querySelector('#compose-recipients');
  const subject = document.querySelector('#compose-subject');
  const body = document.querySelector('#compose-body');
  
  if (typeOfEmail === 'compose') {
    header.textContent = 'New Email';

    // Clear out composition fields
    recipients.value = '' 
    recipients.disabled = false;
    subject.value = ''
    subject.disabled = false; 
    body.value = '';

  } else if (typeOfEmail === 'reply') {
    header.textContent = 'Reply';

    // Pre define inputs for reply
    recipients.value = mail.sender;
    recipients.disabled = true;
    subject.value = formatSubject(mail.subject);
    subject.disabled = true;
    // Resets body
    body.value = '';
    body.value = `<<< On ${mail.timestamp} ${mail.sender} wrote: ${mail.body} >>>\n\n`;
  }
}

async function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Resets
  document.querySelector('#emails-view').textContent = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  const response = await fetch(`/emails/${mailbox}`);
  const mails = await response.json();

  if (mails.length >= 1) {
    mails.forEach(mail => {
      renderMail(mail);
    });
  } else {
    const div = document.createElement('div');
    div.setAttribute('id', 'noEmailStatus');
    div.textContent = 'No emails.';
    document.querySelector('#emails-view').append(div);
  }
}

function renderMail(mail) {
  const container = document.createElement('div');
  container.classList.add(mail.read ? 'hasRead' : 'emailRow', 'emailCell');

  const sender = document.createElement('span');
  sender.textContent = mail.sender;

  const subject = document.createElement('span');
  subject.textContent = mail.subject;

  const timestamp = document.createElement('span');
  timestamp.textContent = mail.timestamp;

  container.addEventListener('click', () => {
    openEmail(mail.id);
  })

  container.append(sender, subject, timestamp);
  document.querySelector('#emails-view').append(container);
}

async function openEmail(id) {
  // Reset email view
  const emailContainer = document.querySelector('#email-view');
  emailContainer.replaceChildren();

  // Show the email and hide other views
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  const response = await fetch(`/emails/${id}`);
  const mail = await response.json();

  await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ read: true })
  });

  const container = document.createElement('div');

  const sender = document.createElement('p');
  sender.innerHTML = `From: <b>${mail.sender}</b>`;

  const recipients = document.createElement('p');
  recipients.innerHTML = `To: <b>${mail.recipients}</b>`;

  const body = document.createElement('div');
  body.classList.add('emailBody')
  body.textContent = mail.body;

  const subject = document.createElement('p');
  subject.innerHTML = `Subject: <b>${mail.subject}</b>`;

  const timestamp = document.createElement('p');
  timestamp.setAttribute('id', 'emailTimestamp')
  timestamp.textContent = mail.timestamp;
  
  container.append(sender, recipients, subject, body, timestamp);

  if (mail.sender !== document.querySelector('#currentUser').textContent) {
    const archiveBtn = document.createElement('button');
    archiveBtn.classList.add('btn', 'btn-warning');
    archiveBtn.textContent = mail.archived ? 'Unarchive' : 'Archive';
    archiveBtn.addEventListener('click', async () => {
      await fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ archived: !mail.archived })
      });
      load_mailbox('inbox');

      if (mail.archived) {
        showNotif('Successfully unarchived the email.', 'success');
      } else {
        showNotif('Successfully archived the email.', 'success');
      }
    }, { once: true });

    if (!mail.archived) {
      const replyBtn = document.createElement('button');
      replyBtn.classList.add('btn', 'btn-danger', 'mx-1');
      replyBtn.textContent = 'Reply';
      replyBtn.addEventListener('click', async () => {
        compose_email('reply', mail);
      }, { once: true });
      container.append(replyBtn);
    }

    container.append(archiveBtn);
  }

  emailContainer.append(container);
}

function formatSubject(subject) {
  if (!(subject.toLowerCase().startsWith('re: '))) {
    return `Re: ${subject}`;
  }
  
  return subject;
}

function showNotif(message, type) {
  const notif = document.querySelector('#mainNotif');
  const wrapper = document.createElement('div');
  wrapper.textContent = message;
  wrapper.setAttribute('id', 'notifWrapper')
  wrapper.classList.add(type)

  notif.append(wrapper)

  setTimeout(() => {
    notif.replaceChildren()
  }, 3000);
}