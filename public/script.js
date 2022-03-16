const socket = io('https://socketio-chat-app2.herokuapp.com/');
let username = '';
let currentRoom = '';
let target = '';
const userRooms = [];
// let mouse_is_inside = false;
// let firstClick = true;


$(document).ready(() => {
    $('input').val('');
    $('#component-register').hide();
    $('#main-app').hide();
    $('#create-room').hide();
    $('#user-rooms').hide();
    $('#my-profile').hide();
    $('#leave-room').hide();
    

    $('#reg-log').click(() => {
        let btn = $('#reg-log');
        let question = $('#question');
        if(btn.text() == 'Register'){
            btn.text('Log In');
            question.text('You have an account?');
            $('#component-register').show();
            $('#btn-index').text('REGISTER');
        }else{
            question.text("You don't have an account?");
            btn.text('Register');
            $('#component-register').hide();
            $('#btn-index').text('LOG IN');
        }
    });

    $('#btn-index').click(() => {
        if($('#btn-index').text() == 'LOG IN'){
            username = $('#name').val();
            $.post('https://socketio-chat-app2.herokuapp.com/login', {
                username: $('#name').val(),
                password: $('#password').val()
            })
            .done(res => {
                $('#first').hide(1000);
                $('#main-app').show(1500);
                initialize();
            })
            .fail((jqXHR, textStatus, error) => {
                $('#message').text(jqXHR.responseText);
                $('#message').show();
                setTimeout(function(){
                    $('#message').hide();
                }, 3500);
            });
        }else{
            if($('#password').val() === $('#password-confirm').val()){
                username = $('#name').val();
                $.post('https://socketio-chat-app2.herokuapp.com/register', {
                    username: $('#name').val(),
                    password: $('#password').val()
                })
                .done(res => {
                    $('#first').hide(1000);
                    $('#main-app').show(1500);
                    initialize();
                })
                .fail((jqXHR, textStatus, error) => {
                    $('#message').text(jqXHR.responseText);
                    $('#message').show();
                    setTimeout(function(){
                        $('#message').hide();
                    }, 3500);
                });
            }else{
                $('#message').text('Confirm password doesn not match!');
                $('#message').show();
                setTimeout(function(){
                    $('#message').hide();
                }, 3500);
            }
        }
    });


    $('#logout').click(() => {
        location.reload();
    });


    $('#send-btn').click(() => {
        const message = $('#text-message').val();
        $('#text-message').val('');
        let messagePiece = `<div class='message-piece user-message'>
                            <p class='message-content'>${message}</p>
                       </div>`;
        $(`#${currentRoom}`).append(messagePiece);
        if(target == 'room'){
            socket.emit('send-room-message', message, currentRoom);
        }else{
            socket.emit('send-private-message', message, currentRoom);
        }
    });

    $('#users').on('click', 'li', function(){
        $('#leave-room').hide();
        let userId = $(this).data('userid');
        $(`#${currentRoom}`).hide();
        $('#room-id').text($(this).text());
        currentRoom = userId;
        target = 'individual';
        if($(`#${userId}`).length){
            $(`#${userId}`).show();
        }else{
            let chatSession = createChatSession(userId);
            $('.chat-area').append(chatSession);
        }
    });


    $('#general').click(() => {
        $('#leave-room').hide();
        $('#room-id').text('ROOM: General');
        $(`#${currentRoom}`).hide();
        currentRoom = 'General';
        target = 'room';
        $(`#${currentRoom}`).show();
    });

    $('#create').click(() => {
        if($('#create-room').is(':visible')){
            $('#create-room').hide();
        }else{
            $('#create-room').show();
        }
    });


    $('#ok').click(() => {
        if($('#room-name').val() == ''){
            $('#create-message').text('Please type in room name!');
            setTimeout(function(){
                $('#create-message').text('');
            }, 3500);
        }else{
            let roomId = $('#room-name').val();
            addRoom(roomId);
            socket.emit('create-room', roomId);
            $('#create-room').hide();
            $('#room-name').val('');
            $(`#${currentRoom}`).hide();
            $('#room-id').text(`ROOM: ${roomId}`);
            currentRoom = roomId;
            target = 'room';
            let chatSession = createChatSession(roomId);
            $('.chat-area').append(chatSession);
            $('#leave-room').show();
        }
    });


    $('#rooms').on('click', 'li', function(){
        $(this).hide();
        let roomId = $(this).data('roomid');
        socket.emit('join-room', roomId);
        addRoom(roomId);
        $(`#${currentRoom}`).hide();
        $('#room-id').text(`ROOM: ${roomId}`);
        currentRoom = roomId;
        target = 'room';
        let chatSession = createChatSession(roomId);
        $('.chat-area').append(chatSession);
        $('#leave-room').show();
    });


    $('#list').click(() => {
        if($('#user-rooms').is(':visible')){
            $('#user-rooms').hide();
        }else {
            $('#user-rooms').show();
        }
    });


    $('#user-rooms').on('click', 'li', function(){
        let roomId = $(this).text();
        $(`#${currentRoom}`).hide();
        $('#room-id').text(`ROOM: ${roomId}`);
        currentRoom = roomId;
        target = 'room';
        $(`#${roomId}`).show();
        $('#leave-room').show();
    });

    $('#profile').click(() => {
        if($('#my-profile').is(':visible')){
            $('#my-profile').hide();
        }else {
            $('#my-profile').show();
        }
    });

    $('#leave-room').click(() => {
        socket.emit('leave-room', currentRoom);
        $(`${currentRoom}`).hide();
        userRooms.splice(userRooms.indexOf(currentRoom), 1);
        $(`#list-${currentRoom}`).remove();
        $('#leave-room').hide();
        currentRoom = 'General';
        $('General').show();
        $('#room-id').text('ROOM: General');
    });


    $(document).keydown(e => {
        if(e.keyCode == 13 && $('#text-message').is(':focus')){
            $('#send-btn').trigger('click');
        }
    });


    // $('.popup').hover(function(){
    //     mouse_is_inside = true;
    // }, function(){
    //     mouse_is_inside = false;
    // });

    // $('#entry').mouseup(function(e){
    //     if(!mouse_is_inside){
    //         $('.popup').hide();
    //     }
    // });
});

function initialize(){
    $('#room-id').text('ROOM: General');
    $('#my-name').text(username);
    socket.emit('identify', username);
    currentRoom = 'General';
    target = 'room';
    let chatSession = createChatSession('General');
    $('.chat-area').append(chatSession);
}

function addRoom(roomId){
    userRooms.push(roomId);
    $('#user-rooms ul').append(`<li id="list-${roomId}">${roomId}</li>`);
}


function createChatSession(id){
    return `<div class=chat-session id=${id}></div>`;
}

socket.on('send-list', onlineUsers => {
    $('#users').empty();
    for(let user in onlineUsers){
        if(user === username){
            continue;
        }
        $('#users').append('<li data-userid=' + onlineUsers[user] + '>' + user + '</li>');
    }
});


socket.on('send-rooms', availableRooms => {
    $('#rooms').empty();
    for(let room in availableRooms){
        if(userRooms.indexOf(room) < 0){
            $('#rooms').append(`<li data-roomid=${room}>${room}</li>`);
        }
    }
});


socket.on('receive-room-message', (username, message, roomId) => {
    let messagePiece = `<div class='message-piece'>
                            <p class='sender'>${username}</p>
                            <p class='message-content'>${message}</p>
                       </div>`;
    
    $(`#${roomId}`).append(messagePiece);
});


socket.on('receive-private-message', (username, message, userId) => {
    let messagePiece = `<div class='message-piece'>
                            <p class='sender'>${username}</p>
                            <p class='message-content'>${message}</p>
                       </div>`;
    if($(`#${userId}`).length){
        $(`#${userId}`).append(messagePiece);
    }else{
        let chatSession = createChatSession(userId);
        $('.chat-area').append(chatSession);
        $(`#${userId}`).hide();
        $(`#${userId}`).append(messagePiece);
    }
});
