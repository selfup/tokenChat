'use strict'

const socket = io.connect('http://idea.selfup.me:3000', {reconnect: true})
const rb = socket

if (localStorage.getItem("authToken") !== null) {
  let clientInfo = JSON.parse(localStorage.getItem("authToken"))
  $( "#authChat" ).html(
    `<div class="form-group">
      <h1>Welcome back ${clientInfo.user.split('###')[1]}</h1>
      <label for="usr">Password:</label>
      <input type="password" class="form-control" id="loginPasswordField">
    </div>
    <button class='btn btn-primary' id="login">Login!</button>
    <button class='btn btn-danger' id="logout">Delete Account!</button>`
  )


  $('#login').on('click', function() {
    rb.send('getTable', clientInfo.user)
  })

  $('#logout').on('click', function() {
    localStorage.clear();
    location.reload();
    rb.send('dropTable', clientInfo.user)
  })

  const correctPass = () => {
    socket.on("foundTable", message => {
      const pass = message["1"].password
      if (pass === `${$('#loginPasswordField').val()}`) {
        let clientInfo = JSON.parse(localStorage.getItem("authToken"))
        rb.send('getUser', clientInfo)
      }
    })
  }

  setTimeout(correctPass(), 500);
}

$('#signup').on('click', function() {
  let name     = 'user03124098###' + `${$('#signUpNameField').val()}`
  let password = `${$('#signUpPasswordField').val()}`
  let token    = Math.random().toString(36).substring(7)

  localStorage.setItem("authToken", JSON.stringify({user: name, token: token}))
  let clientInfo = JSON.parse(localStorage.getItem("authToken"))

  rb.send('createTable', clientInfo.user)
  rb.send(
    'newUser',
    [
      `${name}`,
      {name: name, password: password, token: clientInfo}
    ]
  )

  rb.send('getUser', clientInfo)
})

socket.on("foundUser", message => {
  let clientInfo = JSON.parse(localStorage.getItem("authToken"))
  if (message === 'valid') {
    $( "div.authChat" ).toggleClass( "hidden" )
    $(".appendMe").html(
          `<div class="form-group">
            <label for="usr">Room Id:</label>
            <input type="text" class="form-control" id="roomIdField">
            <label for="usr">Name:</label>
            <input type="text" class="form-control" id="nameField">
            <label for="usr">Message:</label>
            <input type="text" class="form-control" id="messageField">
          </div>
          <button class='btn btn-danger' id="dropTable">Delete All Messages</button>
          <br><br>
          <div class="dataFromDb"></div>
          <br><br>`
    )
    $('#nameField').val(`${clientInfo.user.split('###')[1]}`)

    const createTheMainTable = () => {
      rb.send('createTable', "lol")
    }

    createTheMainTable()

    const getRoomId = () => {
      if ($('#roomIdField').val() === "") { $('#roomIdField').val("lol") }
      let roomId = $('#roomIdField').val()
      return roomId
    }

    const sanitize = (message, name) => {
      if (message.includes("<")) { message = "NO TAGS" }
      if (name.includes("<")) { name = "NO TAGS" }
      if (name === "") { name = "anon" }
      return [message, name]
    }

    const newMessages = (roomId, sanitized) => {
      rb.send('createTable', `${roomId}`)
      rb.send('newData', [`${roomId}`, {message: sanitized[0], name: sanitized[1]}])
    }

    const resetAndDisplay = () => {
      $('#messageField').val("") // clear message input field
      displayMessages()
    }

    $('#messageField').bind("enterKey",function(e){
      let name = `${$('#nameField').val()}`
      let message = `${$('#messageField').val()}`
      let roomId = getRoomId()
      const sanitized = sanitize(message, name)
      newMessages(roomId, sanitized)
      resetAndDisplay()
    })

    const displayMessages = () => {
      rb.send('getTable', `${getRoomId()}`)

      socket.on("foundTable", message => {
        if (message["0"].table === getRoomId()) {
          let nameAndMessage = turnObjectsIntoAList(message).join('')
          $('.dataFromDb').html(nameAndMessage)
        }
      })
    }

    const turnObjectsIntoAList = (message) => {
      let objects = []
      Object.getOwnPropertyNames(message).forEach(function(val, idx) {
        if (idx > 0) {
          objects.push(`<p>${message[idx].name}: ${message[idx].message}</p>`)
        }
      })
      return objects.reverse()
    }

    $('#messageField').keyup(function(e) {
      if(e.keyCode == 13) {
        $(this).trigger("enterKey");
      }
    })

    $('#dropTable').on('click', (e) => {
      rb.send('updateTable', [`${getRoomId()}`, {message: "Chat Data Was Deleted", name: "Chat Bot"}])
      displayMessages()
    })

    displayMessages()
  }
})
