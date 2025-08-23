import { IChatMessage } from '../common/chatMessage.interface';
import { io, Socket } from 'socket.io-client';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { IResponse } from '../common/server.responses';
import { IUser } from '../common/user.interface';
// import {ServerToClientEvents, ClientToServerEvents} from '../common/socket.interface';
// const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

const socket: Socket = io();
socket.on('new-chat-message', (msg: IChatMessage) => {
  onNewChatMessage(msg);
});

const token = localStorage.getItem('token');
const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;

function onLogout(e: Event): void {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = './auth.html';
}

async function postChatMessage(chatMsg: IChatMessage): Promise<void> {
  try {
    const response: AxiosResponse<IResponse> = await axios.post('/chat/messages', chatMsg, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && 'name' in response.data && response.data.name === 'ChatMessageCreated') {
      // const postedMessage = response.data.payload as IChatMessage;
      // addChatMessageToUI(postedMessage);
      // scrollToBottom();
    } else {
      throw new Error('Failed to post message');
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.name === 'MissingChatText') {
        alert('Please enter a message before posting.');
      }
      else if (errorData.name === 'MissingAuthor') {
        alert('Author information is missing. Please log in again.');
      }
      else if (errorData.name === 'UnauthorizedRequest') {
        alert('You can only post messages on your own behalf.');
      }
      else if (errorData.name === 'OrphanedChatMessage') {
        alert('Cannot post a message for a non-existent user.');
      }
      else if (errorData.name === 'MissingToken' || errorData.name === 'InvalidToken') {
        alert('Authentication required. Please log in again.');
        window.location.href = './auth.html';
      }
      else {
        alert(`Error posting message: ${errorData.message || 'Unknown error'}`);
      }
    } else {
      alert('Network error. Please try again.');
    }
  }
}

function onPost(e: Event): void {
  e.preventDefault();
  const textarea = document.getElementById('chatMessage') as HTMLTextAreaElement;
  const messageText = textarea.value.trim();

  if (!messageText) {
    alert('Please enter a message before posting.');
    return;
  }

  if (!currentUser || !currentUser.credentials || !currentUser.credentials.username) {
    alert('User information is missing. Please log in again.');
    window.location.href = './auth.html';
    return;
  }

  const chatMessage: IChatMessage = {
    author: currentUser.credentials.username,
    text: messageText,
    displayName: currentUser.extra?.displayName
  };

  postChatMessage(chatMessage);
  textarea.value = '';
}

function makeChatMessage(
  author: string,
  timestamp: string,
  text: string,
  displayName?: string
): HTMLElement {
  const messageDiv = document.createElement('div');
  const isOwnMessage = currentUser && currentUser.credentials && currentUser.credentials.username === author;
  
  messageDiv.className = `chat-message ${isOwnMessage ? 'own-message' : ''}`;
  
  const headerDiv = document.createElement('div');
  headerDiv.className = 'message-header';
  
  const senderSpan = document.createElement('span');
  senderSpan.className = 'message-sender';
  senderSpan.textContent = isOwnMessage ? 'You' : (displayName || author);
  
  const timestampSpan = document.createElement('span');
  timestampSpan.className = 'message-timestamp';
  timestampSpan.textContent = new Date(timestamp).toLocaleString();
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = text;
  
  headerDiv.appendChild(senderSpan);
  headerDiv.appendChild(timestampSpan);
  messageDiv.appendChild(headerDiv);
  messageDiv.appendChild(contentDiv);
  
  return messageDiv;
}

function addChatMessageToUI(chatMsg: IChatMessage): void {
  const messagesContainer = document.getElementById('existingChatMessages');
  if (messagesContainer) {
    const messageElement = makeChatMessage(
      chatMsg.author,
      chatMsg.timestamp || new Date().toISOString(),
      chatMsg.text,
      chatMsg.displayName
    );
    messagesContainer.appendChild(messageElement);
  }
}

function onNewChatMessage(chatMsg: IChatMessage): void {
  // TODO: eventhandler for websocket new-chat-message event
  // used to update chat message list
  addChatMessageToUI(chatMsg);
  scrollToBottom();
}

function scrollToBottom(): void {
  const messagesContainer = document.getElementById('existingChatMessages');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

async function getChatMessages(): Promise<void> {
  try {
    const response: AxiosResponse<IResponse> = await axios.get('/chat/messages', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data && 'name' in response.data) {
      if (response.data.name === 'ChatMessagesFound') {
        const messages = response.data.payload as IChatMessage[];
        const messagesContainer = document.getElementById('existingChatMessages');
        if (messagesContainer) {
          // Clear existing messages
          const staticMessages = messagesContainer.querySelectorAll('.chat-message');
          staticMessages.forEach(msg => msg.remove());
          
          // Add all messages from server
          messages.forEach(message => {
            addChatMessageToUI(message);
          });
          scrollToBottom();
        }
      } else if (response.data.name === 'NoChatMessagesYet') {
        console.log('No chat messages found');
      }
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.name === 'MissingToken' || errorData.name === 'InvalidToken') {
        alert('Authentication required. Please log in again.');
        window.location.href = './auth.html';
      } else {
        console.error('Error loading messages:', errorData.message);
      }
    } else {
      console.error('Network error loading messages');
    }
  }
}

async function isLoggedIn(): Promise<boolean> {
  if (!token || !currentUser) {
    return false;
  }
  
  try {
    // Verify token is still valid by making a request
    await axios.get('/chat/messages', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return true;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
      return false;
    }
    return true;
  }
}

document.addEventListener('DOMContentLoaded', async function (e: Event) {
  e.preventDefault();
  
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    alert('Please log in to access the chat room.');
    window.location.href = './auth.html';
    return;
  }
  
  // Set up event listeners
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', onLogout);
  }
  
  const postBtn = document.getElementById('postBtn');
  if (postBtn) {
    postBtn.addEventListener('click', onPost);
  }
  
  const textarea = document.getElementById('chatMessage') as HTMLTextAreaElement;
  if (textarea) {
    // Allow posting with Enter key (Shift+Enter for new line)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onPost(e);
      }
    });
  }

  await getChatMessages();
});
