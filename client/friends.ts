import { v4 as uuidV4 } from 'uuid';

import { IFriend } from '../common/friend.interface';

let friends: IFriend[];

function loadFriends(): IFriend[] {
  // TODO: read friends from local storage
  const storedFriends = localStorage.getItem('friends');
  return storedFriends ? JSON.parse(storedFriends) : [];
}

function saveFriends(): void {
  // TODO: save friends to local storage
  localStorage.setItem('friends', JSON.stringify(friends));
}

function createRawFriendElement(friend: IFriend): HTMLElement {
  // TODO: create an HTML friend element without any listeners attached
  const friendElement = document.createElement('div');
  friendElement.className = 'friend-item';
  friendElement.innerHTML = `
  <input type="checkbox" class="invite-checkbox" ${friend.invited ? 'checked' : ''}>
    <div class="friend-info">
      <div class="friend-name">${friend.displayName}</div>
      <div class="friend-email">${friend.email}</div>
    </div>
    <button class="remove-friend-btn" title="Delete">X</button>
  `;
  return friendElement;
}

function addBehaviorToFriendElement(friendEmnt: HTMLElement, friend: IFriend): HTMLElement {
  // TODO: add required listeners to the HTML friend element
  const removeButton = friendEmnt.querySelector('.remove-friend-btn');
  const inviteCheckbox = friendEmnt.querySelector('.invite-checkbox') as HTMLInputElement;

  if (removeButton) {
    removeButton.addEventListener('click', () => onDeleteFriend(friend));
  }

  if (inviteCheckbox) {
    inviteCheckbox.addEventListener('change', () => onInviteFriend(friend));
  }

  return friendEmnt;
}

function appendFriendElementToDocument(friendEmnt: HTMLElement): void {
  // TODO: add HTML friend element with listeners to the right HTML elememnt in the document
  const friendList = document.getElementById('friendList');
  if (friendList) {
    friendList.append(friendEmnt)
    window.scrollTo(0, document.body.scrollHeight);
  }
}

function loadFriendsIntoDocument(): void {
  // TODO: read friends from local storage and add them to the document
  friends = loadFriends();
  const friendList = document.getElementById('friendList');
  if (friendList) {
    friendList.innerHTML = '';
    friends.forEach(friend => {
      const friendElement = createRawFriendElement(friend);
      addBehaviorToFriendElement(friendElement, friend);
      appendFriendElementToDocument(friendElement);
    });

    if (friends.length >= 1) {
      const clearListContainer = document.createElement('div');
      clearListContainer.className = 'clear-list-container';
      clearListContainer.innerHTML =
        '<button id="clearListBtn" class="clear-list-btn">Clear List</button>';
      friendList.append(clearListContainer);    
    }
  }

  const clearListBtn = document.getElementById('clearListBtn');
  if (clearListBtn) {
    clearListBtn.addEventListener('click', onClearList);
  }
  
  window.scrollTo(0, document.body.scrollHeight);
}

function onAddFriend(event: Event): void {
  // TODO: event handler to create a new friend from form info and append it to right HTML element in the document
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const nameInput: HTMLInputElement | null = form.querySelector('[name="friendName"]')
  const emailInput: HTMLInputElement | null = form.querySelector('[name="friendEmail"]')

  if (!nameInput || !emailInput) return;

  const name = nameInput.value;
  const email = emailInput.value.toLowerCase();

  if (friends.some(f => f.email.toLowerCase() === email)) {
    alert("A friend with this email already exists! Try again.")
    emailInput.value = '';
    return;
  }

  const newFriend: IFriend = {
    id: 'f-' + uuidV4(),
    displayName: name,
    email: email,
    invited: false
  };

  friends.push(newFriend);
  saveFriends();

  const friendElement = createRawFriendElement(newFriend);
  addBehaviorToFriendElement(friendElement, newFriend);
  appendFriendElementToDocument(friendElement);
  loadFriendsIntoDocument();
  form.reset();
}

function onDeleteFriend(friend: IFriend): void {
  // TODO: event handler to remove an existing friend from local storage and the document
  if (confirm("Are you sure you want to delete this friend?")) {
    friends = friends.filter(f => f.id !== friend.id);
    saveFriends();
    
    const friendElement = document.getElementById(friend.id);
    if (friendElement) {
      friendElement.remove();
    }
    
    loadFriendsIntoDocument();
  }
}

function onClearList(): void {
  if (confirm('Are you sure you want to clear your Friend List?')) {
    friends = [];
    saveFriends();

    const friendList = document.getElementById('friendList');
    if (friendList) {
      friendList.innerHTML = '';
    }
  }
}

function onInviteFriend(friend: IFriend): void {
  // TODO: event handler to invite a friend by email when a checkbox is checked
  const friendIndex = friends.findIndex(f => f.id === friend.id);
  if (friendIndex !== -1) {
    const wasInvited = friends[friendIndex].invited;

    if (wasInvited) {
      alert(
        'You may have already invited this friend! After unchecking this checkbox, you can re-invite this friend by rechecking it.'
      );
      friends[friendIndex].invited = false;
    } else {
      const subject = 'I am inviting you to YACA';
      const body = 'Please visit http://yaca-adrianmu.onrender.com to register and invite your own Friends.';
      const mailtoLink = `mailto:${friend.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const newWindow: Window | null = window.open(
        mailtoLink,
        'toolbar=no,scrollbars=no,width=300px,height=400px'
      );
      if (newWindow) {
        newWindow.focus();
      }
      friends[friendIndex].invited = true;
    }
    saveFriends();
  }

}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('newFriendForm') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', onAddFriend);
  }
  loadFriendsIntoDocument();
});
