/* eslint-disable no-console */
// TODO: write code here

// Кнопка по которой отправляется некоторое сообщение
// const btnSend = document.querySelector('.btn-send');
// btnSend.addEventListener('click', sendMessage);

const ws = new WebSocket('ws://localhost:8080');

ws.addEventListener('open', () => {
  console.log('Соединение установлено');
  // ws.send(JSON.stringify('New user connecting'));
  ws.send('send this string');
});

ws.addEventListener('message', (event) => {
  console.log('Получено message: ', JSON.parse(event.data));
});

ws.addEventListener('close', (event) => {
  console.log('Соединение закрыто', event);
});
