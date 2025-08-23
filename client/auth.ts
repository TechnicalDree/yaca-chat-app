import axios, { AxiosResponse } from 'axios';
import { IResponse } from '../common/server.responses';
import { IUser } from '../common/user.interface';

async function login() {
  const emailInput = document.getElementById('myEmail') as HTMLInputElement;
  const passwordInput = document.getElementById('myPassword') as HTMLInputElement;
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email) {
    alert('Email is required.');
    return;
  }
  if (!password) {
    alert('Password is required.');
    return;
  }
  try {
    const response = await fetch(`/auth/tokens/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await response.json();
    if (response.ok) {
      // Save token and user info
      localStorage.setItem('token', data.payload.token);
      
      // Store with password
      // localStorage.setItem('user', JSON.stringify(data.payload.user));

      // Store without password
      const userInfo = {
        credentials: {
          username: data.payload.user.credentials.username
        },
        extra: data.payload.user.extra,
        _id: data.payload.user._id
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      alert('Login successful!');
      window.location.href = './chat.html';
    } else {
      alert(data.message || 'Login failed.');
    }
  } catch (err) {
    alert('Network error. Please try again.');
  }
}

async function register() {
  const nameInput = document.getElementById('myName') as HTMLInputElement;
  const emailInput = document.getElementById('myEmail') as HTMLInputElement;
  const passwordInput = document.getElementById('myPassword') as HTMLInputElement;
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  try {
    const response = await fetch('/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extra: name, email, password })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Registration successful!');
      nameInput.value = '';
      emailInput.value = '';
      passwordInput.value = '';
    } else {
      alert(data.message || 'Registration failed.');
    }
  } catch (err) {
    alert('Network error. Please try again.');
  }
}

async function onSubmitForm(e: SubmitEvent) {
  e.preventDefault();
  const whichButton = (e.submitter as HTMLInputElement)?.id;
  if (whichButton === 'registerBtn') {
    await register();
  } else if (whichButton === 'loginBtn') {
    await login();
  }
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('myPassword') as HTMLInputElement;
  const toggleButton = document.getElementById('togglePassword') as HTMLButtonElement;
  const icon = toggleButton.querySelector('i') as HTMLElement;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    passwordInput.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

document.addEventListener('DOMContentLoaded', async function (e: Event) {
  const form = document.getElementById('authForm') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', onSubmitForm as EventListener);
  }

  const toggleButton = document.getElementById('togglePassword');
  if (toggleButton) {
    toggleButton.addEventListener('click', togglePasswordVisibility);
  }
});
