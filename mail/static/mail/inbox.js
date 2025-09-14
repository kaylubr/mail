document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  const form = document.querySelector('#compose-form');
  const recipients = document.querySelector('#compose-recipients');
  const subject = document.querySelector('#compose-subject');
  const body = document.querySelector('#compose-body');
  
  // Clear out composition fields
  recipients.value = '' 
  subject.value = '' 
  body.value = '' 

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const response = await fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients.value,
        subject: subject.value,
        body: body.value,
      })
    });

    const data = await response.json(); // Text for status later
    load_mailbox('inbox');
  });
}

async function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  const response = await fetch(`/emails/${mailbox}`);
  const mails = await response.json();
  mails.forEach(mail => {
    renderMail(mail);
  });
}

function renderMail(mail) {
  const container = document.createElement('div');

  const sender = document.createElement('span');
  sender.textContent = mail.sender;

  const subject = document.createElement('span');
  subject.textContent = mail.subject;

  const timestamp = document.createElement('span');
  timestamp.textContent = mail.timestamp;

  container.append(sender, body, timestamp);
  document.querySelector('#emails-view').append(container);
}