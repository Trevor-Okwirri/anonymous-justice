// Chat routes
const {
    verifyToken,
  } = require("./verifyToken");
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require("../models/User");

// GET /chats - Get all chats for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    }).populate('sender', '-password').populate('receiver', '-password').exec();

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /chats/:id - Get chat with the specified user
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      $or: [
        { sender: req.user.id, receiver: req.params.id },
        { sender: req.params.id, receiver: req.user.id }
      ]
    }).populate('sender', '-password').populate('receiver', '-password').exec();

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST /chats - Create a new chat
router.post('/', verifyToken, async (req, res) => {
  try {
    const { receiver, message } = req.body;

    // Check if the receiver exists
    const receiverUser = await User.findById(receiver);

    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if there is already a chat between these two users
    let chat = await Chat.findOne({
      $or: [
        { sender: req.user.id, receiver: receiver },
        { sender: receiver, receiver: req.user.id }
      ]
    });

    if (chat) {
      // Update the existing chat
      chat.message = message;
      chat.read = false;
      await chat.save();
    } else {
      // Create a new chat
      chat = new Chat({
        sender: req.user.id,
        receiver,
        message,
      });
      await chat.save();
    }

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT /api/chat/:id/read Update the read status of the chat
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
      const chat = await Chat.findById(req.params.id);
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      if (chat.receiver.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
  
      chat.read = true;
      await chat.save();
      
      return res.json({ message: 'Chat read status updated' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;