const express = require('express')
const app = express()
const path = require('path')
const PORT = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`))
const io = require('socket.io').listen(server)

let users = {}

function joinRoom(socket, room) {
    if (socket.room) {
        socket.leave(socket.room)
    }
    socket.join(room)
    socket.room = room
    console.info(socket.id + ' joined room ' + room)
}

app.get('/:id', (req, res) => {
    const room = req.params['id']
	io.on('connection', (socket) => {
		let id = socket.id

		joinRoom(socket, room)
	})

	res.render('index', {
		room: room
	})
})

// If user connect to normal page without id
// => generate id and send him to this page
app.get('/', (req, res) => {
    const generatedRoom = guid()
    res.writeHead(302, {
        'Location': '/' + generatedRoom
    })
    res.end()
})

function broadcastToRoom(room, event) {
    io.to(room).emit(event)
}

io.on('connection', (socket) => {
    const id = socket.id

    socket.on('playerEvent', (data) => {
        switch (data.event) {
            case 'play':
                broadcastToRoom(socket.room, 'playVideo')
                break
            case 'pause':
                broadcastToRoom(socket.room, 'pauseVideo')
                break
            case 'time':
                const timelineClick = data.timelineClick
                io.to(socket.room).emit('timelineClick', timelineClick)
                break
			case 'sync':
                broadcastToRoom(socket.room, 'syncVideo')
                break
        }
    })

    socket.on('userJoin', (username) => {
        if (!username) {
            const generatedUsername = Math.random().toString(36).substring(7)
            username = generatedUsername
            io.to(socket.room).emit('userJoin', generatedUsername)
        } else {
            io.to(socket.room).emit('userJoin', username)
        }

        users[id] = username
        io.in(socket.room).clients((err, clients) => {
            io.to(socket.room).emit('connectedCount', clients.length)
        })

        io.in(socket.room).clients((err, clients) => {
            clients.forEach((clientId) => {
                if (clientId != id) {
                    socket.emit('userJoin', users[clientId])
                }
            })
        })
    })

    socket.on('disconnect', () => {
        const username = users[id]
        io.to(socket.room).emit('userLeave', username)

        io.in(socket.room).clients((err, clients) => {
            io.to(socket.room).emit('connectedCount', clients.length)
        })

        delete users[id]
    })

    console.log('a user connected')
})

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}