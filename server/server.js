const mongoose = require('mongoose');
const Document = require('./Document');

const uri =
  'mongodb+srv://naveen:mongo123@cluster0.8jp4o.mongodb.net/google-doc-clone?retryWrites=true&w=majority';

try {
  // Connect to the MongoDB cluster
  mongoose.connect(
    uri,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    },
    () => console.log(' Mongoose is connected')
  );
} catch (e) {
  console.log('could not connect');
}

// 3009 is the port in which it is running. And we are saying don't give cors error for the origin specified.
const io = require('socket.io')(3009, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const defaultValue = '';

io.on('connection', (socket) => {
  socket.on('get-document', async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    // This will create a room sort of.
    socket.join(documentId);
    socket.emit('load-document', document.data);

    // This is to ensure that the change done in one screen is seen in all the multiple screens opening same documentId.
    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    socket.on('save-document', async (data) => {
      console.log('saving document ', documentId);
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  console.log('Find doc ', id, document);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}
