/* eslint-disable no-console */
import { createPopper } from '@popperjs/core';

export default class Messenger {
  constructor(register, chat) {
    this.register = register;
    this.chat = chat;
    this.youName = null;
    this.sendForm = this.chat.querySelector('#send-form');
    this.onlineList = this.chat.querySelector('.online__list');
    this.messages = this.chat.querySelector('.communication__messages');
    this.ws = null; // websocket
    this.webSocketServerURL = 'ws://localhost:8080'; // Адрес ws сервера

    this.registerEvents();
  }

  registerEvents() {
    const loginForm = this.register.querySelector('#register-form');
    loginForm.addEventListener('submit', this.loginHandler.bind(this));
    this.sendForm.addEventListener('submit', this.sendMessageHandler.bind(this));
  }

  init() {
    this.connectWebsocketServer(); // Подключение к серверу
  }

  /**
   * Соединение с сервером
   */
  connectWebsocketServer() {
    this.ws = new WebSocket(this.webSocketServerURL);

    this.ws.addEventListener('open', () => {
      console.log('Соединение установленно');
    });

    this.ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      switch (data.event) {
        case 'login':
          this.receivedLoginMessage(data);
          break;
        case 'newParticipant':
          this.addNewParticipant(data);
          break;
        case 'offline':
          this.offlineParticipant(data);
          break;
        case 'sendMessage':
          this.addChatMessage(data);
          break;
        default:
      }
    });

    this.ws.addEventListener('close', (event) => {
      console.log('Соединение закрыто', event);
    });

    this.ws.addEventListener('error', (event) => {
      console.log('Какая-то ошибка подключения', event);
    });
  }

  /**
   * Отправка данных на сервер
   */
  sendMessage(data) {
    this.ws.send(JSON.stringify(data));
  }

  /**
   * Обработка формы регистрации
   * @param {*} event -
   */
  loginHandler(event) {
    event.preventDefault();
    let inputValue = event.target.elements.login.value.trim();
    if (inputValue !== '') {
      inputValue = inputValue[0].toUpperCase() + inputValue.slice(1);
      const data = {
        event: 'login',
        participant: inputValue,
      };
      this.sendMessage(data); // Отправляем данные на сервер
    } else {
      this.showErrorTooltip('Напишите свое имя'); //! Ошибка пустое поле
    }
  }

  /**
   * Обработка входящего сообщения при login
   * @param {*} message - сообщение
   */
  receivedLoginMessage(data) {
    if (data.status) {
      this.youName = data.participant;
      this.chat.querySelector('.online__title').textContent = this.youName;
      this.register.classList.add('register-hidden');
      this.chat.classList.remove('hidden');
      // Формируем список участников онлайн
      const onlineList = data.online.filter((item) => item.participant !== this.youName);
      this.onlineList.innerHTML = ''; // Очищаем список
      onlineList.forEach((user) => {
        const onlineEl = this.constructor.createOnlineCard(user);
        this.onlineList.append(onlineEl);
      });
      // Отправляем данные
      this.sendMessage({
        event: 'newParticipant',
        participant: data.participant,
        message: data.message,
      });
    } else {
      this.showErrorTooltip(data.message); //! Ошибка имя занято
    }
  }

  /**
   * Событие отправить сообщение
   * @param {*} event -event
   */
  sendMessageHandler(event) {
    event.preventDefault();
    const message = event.target.elements.send.value.trim();
    if (message === '') return;
    this.sendMessage({
      event: 'sendMessage',
      participant: this.youName,
      message,
    });
    this.sendForm.reset();
  }

  /**
   * Добавляем сообщение в чат
   * @param {*} data - данные с сервера
   */
  addChatMessage(data) {
    const { participant, message, date } = data;
    const messageEl = this.constructor.createChatMessage(participant, message, date);
    if (participant === this.youName) {
      messageEl.classList.add('message-my');
    }
    this.messages.prepend(messageEl);
  }

  /**
   * Добавляем нового участника в список онлайн и инфо в чат
   * @param {*} data - {event: '', participant: '', message: ''};
   */
  addNewParticipant(data) {
    // Если свое имя не добавляем в список онлайн
    if (data.participant !== this.youName) {
      const onlineEl = this.constructor.createOnlineCard(data);
      this.onlineList.append(onlineEl);
    }
    this.showInfoMessage(data.message);
  }

  /**
   * Действие при отключении участника
   * @param {*} data - данные с сервера
   */
  offlineParticipant(data) {
    const allOnline = Array.from(this.onlineList.children); // Список всех онлайн участников в html
    allOnline.forEach((elem) => {
      if (elem.dataset.id === data.id) {
        elem.remove();
      }
    });
    this.showInfoMessage(data.message);
  }

  /**
   * Показывает инфо сообщение об подкл или откл участника
   * @param {*} message - текст сообщения
   */
  showInfoMessage(message) {
    const chatMessage = this.constructor.createNewParticipant(message);
    this.messages.prepend(chatMessage); // Инфо о отключении участника
  }

  /**
   * Карточка онлайн участника
   * @param {*} name -  имя
   * @returns - html элемент
   */
  static createOnlineCard(data) {
    const div = document.createElement('div');
    div.classList.add('online__user');
    div.dataset.id = data.id;
    const p = document.createElement('p');
    p.classList.add('online__name');
    p.textContent = data.participant;
    const status = document.createElement('div');
    status.classList.add('online__status');
    status.textContent = 'Online';
    div.append(p);
    div.append(status);
    return div;
  }

  /**
   * Элемент чата, присоединился новый пользователь
   * @param {*} name - имя пользователя
   * @returns - html элемент
   */
  static createNewParticipant(message) {
    const div = document.createElement('div');
    div.classList.add('communication__new-user');
    div.textContent = message;
    return div;
  }

  /**
   * Создает html элемент сообщения чата
   * @param {*} participant - участник
   * @param {*} message - текст сообщения
   * @param {*} date - дата сообщения
   * @returns - html элемент
   */
  static createChatMessage(participant, message, date) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message');
    const messageHeaderEl = document.createElement('div');
    messageHeaderEl.classList.add('message__header');
    const nickNameEl = document.createElement('span');
    nickNameEl.classList.add('message__nickname');
    nickNameEl.textContent = participant;
    const dateEl = document.createElement('span');
    dateEl.classList.add('message-date');
    dateEl.textContent = date;
    const messageTextEl = document.createElement('p');
    messageTextEl.classList.add('message__text');
    messageTextEl.textContent = message;
    messageHeaderEl.append(nickNameEl);
    messageHeaderEl.append(dateEl);
    messageEl.append(messageHeaderEl);
    messageEl.append(messageTextEl);
    return messageEl;
  }

  /**
   * Показывает сообщение об ошибке
   * @param {*} text - текст сообщения
   */
  showErrorTooltip(text) {
    const element = this.register.querySelector('#login');
    const tooltip = this.register.querySelector('#error-tooltip');
    const popperInstance = createPopper(element, tooltip, {
      placement: 'top',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 6],
          },
        },
      ],
    });
    this.register.querySelector('#error-message').textContent = text;
    tooltip.setAttribute('data-show', '');
    popperInstance.update();
    element.focus();
    setTimeout(() => {
      tooltip.removeAttribute('data-show');
    }, 2800);
  }
}
