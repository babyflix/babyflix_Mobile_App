// import React, { useEffect, useRef, useState } from 'react';
// import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Platform, ScrollView, RefreshControl } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import Colors from '../constants/Colors';
// import Header from '../components/Header';
// import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL } from '@env';
// import axios from 'axios';
// import { useFocusEffect } from '@react-navigation/native';
// import { BackHandler } from 'react-native';
// import { useNavigation } from 'expo-router';
// import { useDispatch, useSelector } from 'react-redux';
// import Loader from '../components/Loader';
// import { connectSocket, getSocket } from '../services/socket';


// const MessagesScreen = () => {
//   const [selectedMessageId, setSelectedMessageId] = useState();
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [chatMembers, setChatMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [chatHistory, setChatHistory] = useState([]);
//   const [chatHistories, setChatHistories] = useState([])
//   const [count, setCount] = useState(0);
//   const [messageLimit, setMessageLimit] = useState(10);
//   const [isFetchingMore, setIsFetchingMore] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [allowKeyboard, setAllowKeyboard] = useState(false);
//   const [isTyping, setIsTyping] = useState(false); 
//   const [onlineUsers, setOnlineUsers] = useState([]);
//   const [isReceiverTyping, setIsReceiverTyping] = useState(false);


//   const chatMembersRef = useRef();
//   const scrollViewRef = useRef();
//   const inputRef = useRef(null);
//   const navigation = useNavigation();
//   const dispatch = useDispatch();
//   const Loading = useSelector((state) => state.ui.loading);
//   const unreadMessagesCount = useSelector((state) => state.header.unreadMessagesCount);
//   const unreadMessages = useSelector((state) => state.header.unreadMessages);
//   const user = useSelector((state) => state.auth);

//   useEffect(() => {
//     getChatMembers();
//   }, [unreadMessagesCount]);

//   useEffect(() => {
//     // Connect only once you have user data
//     const userUuid = user.uuid; // You can fetch from Redux/store
//     const socket = connectSocket(userUuid);

//     if (socket.connected) {
//       console.log('✅ Socket is connected');
//     } else {
//       console.log('❌ Socket is NOT connected');
//     }

//     socket.on('online-users', (users) => {
//       setOnlineUsers(users);
//       console.log('users',users)
//     });
  
//     return () => {
//       socket.disconnect();
//     };
//   }, []);

//   useEffect(() => {
//     const socket = getSocket();
  
//     if (!socket) return;
  
//     socket.on('receive-message', (msg) => {
//       const shouldAdd = msg.sender_uuid === selectedMessageId || msg.recipient_uuid === selectedMessageId;
//       if (shouldAdd) {
//         setMessages(prev => [...prev, msg]);
//         setTimeout(() => {
//           scrollViewRef.current?.scrollToEnd({ animated: true });
//         }, 100);
//       }
//       socket.on('typing', ({ from, to }) => {
//         if (from === selectedMessageId && to === user.uuid) {
//           setIsReceiverTyping(true);
//           clearTimeout(socket.typingTimeout);
//           socket.typingTimeout = setTimeout(() => {
//             setIsReceiverTyping(false);
//           }, 2000);
//         }
//       });
  
//       // Update unread message list globally if needed
//     });
  
//     return () => {
//       socket.off('receive-message');
//       socket.off('typing');
//     };
//   }, [selectedMessageId]);
  
  

//   useEffect(() => {
//     const backAction = () => {
//       if (selectedMessageId !== null) {
//         setSelectedMessageId(null);
//         getChatMembers();
//         return true;
//       }
//       return false;
//     };
//     const backHandler = BackHandler.addEventListener(
//       'hardwareBackPress',
//       backAction
//     );

//     return () => backHandler.remove();
//   }, [selectedMessageId]);

//   const getChatMembers = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/chats/get-chat-members`);
//       if (response.data) {
//         setChatMembers(response.data);
//         chatMembersRef.current = response.data;
//         setLoading(false);
//       } else {
//         console.error("Error : Data not Comming");
//       }
//     } catch (err) {
//       setError('Error fetching chat members');
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await getChatMembers();
//     setRefreshing(false);
//   };

//   useEffect(() => {
//     if (chatMembers.length > 0) {
//       getChatHistory(messageLimit);
//     }
//   }, [chatMembers, messageLimit ,unreadMessagesCount]);

//   useEffect(() => {
//     if (selectedMessageId) {
//       setTimeout(() => {
//         inputRef.current?.focus();
//       }, 300);
//     }
//     setAllowKeyboard(false);
//   }, [selectedMessageId]);

//   const getChatHistory = async (limit = 10) => {
//     setLoading(true);
//     try {
//       const histories = await Promise.all(
//         chatMembers.map(async (member) => {
//           const recipientUuid = member.uuid;
//           const messageUuid = '';

//           const response = await axios.get(
//             `${EXPO_PUBLIC_API_URL}/api/chats/get-chat-history?recipientUuid=${recipientUuid}&limit=${limit}&messageUuid=${messageUuid}`
//           );

//           return response.data;
//         })
//       );

//       const flattenedHistories = histories.flat();

//       //console.log('flattenedHistories',flattenedHistories)
//       setChatHistories((prevHistories) => {
//         const newMessages = flattenedHistories.filter(
//           msg => !prevHistories.some(prev => prev.message_uuid === msg.message_uuid)
//         );
//         const combined = [...prevHistories, ...newMessages];
//         combined.sort((a, b) => new Date(a.date) - new Date(b.date));
//         return combined;
//       });

//       if (selectedMessageId) {
//         const updatedMessages = flattenedHistories.filter(
//           (msg) =>
//             msg.sender_uuid === selectedMessageId ||
//             msg.recipient_uuid === selectedMessageId
//         );

//         setMessages((prevMessages) => {
//           const uniqueMessages = updatedMessages.filter(
//             (msg) =>
//               !prevMessages.some(
//                 (prev) => prev.message_uuid === msg.message_uuid
//               )
//           );
//           return [...prevMessages, ...uniqueMessages].sort((a, b) => new Date(a.date) - new Date(b.date));
//         });
//       }

//       setLoading(false);
//       setIsFetchingMore(false);
//     } catch (err) {
//       setError('Error fetching chat history');
//       setLoading(false);
//     }
//   };

//   const handleMessagePress = ({ Uuid }) => {
//     setSelectedMessageId(Uuid);
//     const selectedMessages = chatHistories.filter((msg) => msg.sender_uuid === Uuid || msg.recipient_uuid === Uuid);
//     const selectChatHistory = chatMembers.filter((msg) => msg.uuid === Uuid);
//     setMessages(selectedMessages);
//     setChatHistory(selectChatHistory);

//     //console.log('selectedMessages',selectedMessages)
//     let messages_Uuid;
 
//     const lastUnreadTime = unreadMessages.length > 0 ? unreadMessages[0].last_unread_message_time : null;
//     //console.log('lastUnreadTime', lastUnreadTime);
//     if (lastUnreadTime) {
//       const currentTimestamp = new Date(lastUnreadTime).getTime();
//       //console.log('currentTimestamp', currentTimestamp);
//       messages_Uuid = `m-${currentTimestamp}`
//       //console.log('messages_Uuid',messages_Uuid)
//     }

//     const updateMessageStatus = async () => {
//       try {
//         const payload = {
//           message_uuid: messages_Uuid,
//           status: 'read'
//         };
    
//         const response = await axios.put(`${EXPO_PUBLIC_API_URL}/api/chats/update-message-status`, payload);
    
//         console.log('Message status updated:', response.data);
//       } catch (error) {
//         console.error('Error updating message status:', error);
//       }
//     }

//     if(unreadMessagesCount>0){
//       updateMessageStatus();
//     }
//   };

//   const handleSendMessage = async () => {
//     const currentTimestamp = Date.now();
//     const messages_Uuid = `m-${currentTimestamp}`
//     const uuid = chatHistory[0].uuid;

//     const newMessage = {
//       message_uuid: messages_Uuid,
//       content: message,
//       sender: "You",
//       recipient_uuid: uuid,
//       date: currentTimestamp,
//       status: "sent",
//     };

//     setMessages((prev) => [...prev, newMessage]);
//     setMessage('');

//     setTimeout(() => {
//       scrollViewRef.current?.scrollToEnd({ animated: true });
//     }, 100);
//     setLoading(true);
//     try {
//       const socket = getSocket();
//       socket.emit('send-message', {
//         ...newMessage,
//         sender_uuid: user.uuid,
//       });
//       const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/chats/send-message`, {
//         recipientUuid: uuid,
//         content: message,
//         message_uuid: messages_Uuid,
//         date: currentTimestamp
//       }, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': 'Bearer YOUR_API_KEY'
//         }
//       });
//       setCount(count + 1);
//       setLoading(false);
//     } catch (error) {
//       console.error('Error sending message:', error.response ? error.response.data : error.message);
//       setLoading(false);
//     }
//     setMessage('');
//     setTimeout(() => {
//       scrollViewRef.current?.scrollToEnd({ animated: true });
//     }, 100);    
//   };

//   const handleTyping = () => {
//     const socket = getSocket();
//     if (selectedMessageId && socket) {
//       socket.emit('typing', {
//         to: selectedMessageId,
//         from: user.uuid,
//       });
//     }
//   };  

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Platform, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import Header from '../components/Header';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL } from '@env';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useNavigation } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/Loader';
import { connectSocket, getSocket } from '../services/socket';

const MessagesScreen = () => {
  const [selectedMessageId, setSelectedMessageId] = useState();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatMembers, setChatMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatHistories, setChatHistories] = useState([]);
  const [count, setCount] = useState(0);
  const [messageLimit, setMessageLimit] = useState(10);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allowKeyboard, setAllowKeyboard] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isReceiverTyping, setIsReceiverTyping] = useState(false);

  const chatMembersRef = useRef();
  const scrollViewRef = useRef();
  const inputRef = useRef(null);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const Loading = useSelector((state) => state.ui.loading);
  const unreadMessagesCount = useSelector((state) => state.header.unreadMessagesCount);
  const unreadMessages = useSelector((state) => state.header.unreadMessages);
  const user = useSelector((state) => state.auth);

  useEffect(() => {
    getChatMembers();
  }, [unreadMessagesCount]);

  useEffect(() => {
    const userUuid = user.uuid;
    const socket = connectSocket(userUuid);

    if (socket.connected) {
      console.log('✅ Socket is connected');
    } else {
      console.log('❌ Socket is NOT connected');
    }

    socket.emit('register', userUuid);

    socket.on('online-users', (users) => {
      setOnlineUsers(users);
      console.log('users', users);
    });

    socket.on('userStatus', ({ username, status }) => {
      setOnlineUsers((prevUsers) => {
        const updatedUsers = { ...prevUsers, [username]: status };
        console.log('updatedUsers',updatedUsers)
        return updatedUsers;
      });
    });

    // socket.on('messageStatus', ({ message_uuid, status }) => {
    //   setMessages((prevMessages) =>
    //     prevMessages.map((msg) =>
    //       msg.message_uuid === message_uuid ? { ...msg, status } : msg
    //     )
    //   );
    // });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    //console.log('message',messages)
    const socket = getSocket();
    if (!socket) return;

    socket.on("privateMessage", (msg) => {
      console.log("Received message:", msg);
  
      const isInCurrentChat =
        msg.senderId === selectedMessageId ||
        msg.receiverName === selectedMessageId;
  
      if (isInCurrentChat) {
        setMessages((prev) => [...prev, msg]);
  
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });
  
    socket.on("messageStatus", ({ message_uuid, status }) => {
      console.log("Status update:", message_uuid, status);
  
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.message_uuid === message_uuid
            ? { ...msg, status }
            : msg
        )
      );
    });

    socket.on('typing', (data) => {
      console.log('🟡 Typing data received:', data);
    
      const { sender, status } = data;
    
      if (status === 'typing' && sender === selectedMessageId) {
        setIsReceiverTyping(true);
        clearTimeout(socket.typingTimeout);
        socket.typingTimeout = setTimeout(() => {
          setIsReceiverTyping(false);
        }, 2000);
      } else if (status === 'stopped' && sender === selectedMessageId) {
        setIsReceiverTyping(false);
      }
    });
    

    return () => {
      socket.off("privateMessage");
      socket.off("messageStatus");
      socket.off('typing');
      clearTimeout(socket.typingTimeout);
    };
  }, [selectedMessageId]);

  useEffect(() => {
    const backAction = () => {
      if (selectedMessageId !== null) {
        setSelectedMessageId(null);
        getChatMembers();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedMessageId]);

  const getChatMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/chats/get-chat-members`);
      if (response.data) {
        setChatMembers(response.data);
        chatMembersRef.current = response.data;
        setLoading(false);
      }
    } catch (err) {
      setError('Error fetching chat members');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getChatMembers();
    setRefreshing(false);
  };

  useEffect(() => {
    if (chatMembers.length > 0) {
      getChatHistory(messageLimit);
    }
  }, [chatMembers, messageLimit, unreadMessagesCount]);

  useEffect(() => {
    if (selectedMessageId) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
    setAllowKeyboard(false);
  }, [selectedMessageId]);

  const getChatHistory = async (limit = 10) => {
    setLoading(true);
    try {
      const histories = await Promise.all(
        chatMembers.map(async (member) => {
          const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/chats/get-chat-history?recipientUuid=${member.uuid}&limit=${limit}`);
          return response.data;
        })
      );

      const flattenedHistories = histories.flat();
      setChatHistories(prevHistories => {
        const newMessages = flattenedHistories.filter(msg => !prevHistories.some(prev => prev.message_uuid === msg.message_uuid));
        const combined = [...prevHistories, ...newMessages];
        combined.sort((a, b) => new Date(a.date) - new Date(b.date));
        return combined;
      });

      if (selectedMessageId) {
        const updatedMessages = flattenedHistories.filter(msg =>
          msg.sender_uuid === selectedMessageId || msg.recipient_uuid === selectedMessageId
        );
        setMessages(prevMessages => {
          const uniqueMessages = updatedMessages.filter(msg =>
            !prevMessages.some(prev => prev.message_uuid === msg.message_uuid)
          );
          return [...prevMessages, ...uniqueMessages].sort((a, b) => new Date(a.date) - new Date(b.date));
        });
      }

      setLoading(false);
      setIsFetchingMore(false);
    } catch (err) {
      setError('Error fetching chat history');
      setLoading(false);
    }
  };

  const handleMessagePress = ({ Uuid }) => {
    setSelectedMessageId(Uuid);
    const selectedMessages = chatHistories.filter(msg =>
      msg.sender_uuid === Uuid || msg.recipient_uuid === Uuid
    );
    const selectChatHistory = chatMembers.filter(msg => msg.uuid === Uuid);
    console.log('selectChatHistory',selectChatHistory)
    setMessages(selectedMessages);
    setChatHistory(selectChatHistory);

    const lastUnreadTime = unreadMessages.length > 0 ? unreadMessages[0].last_unread_message_time : null;

    let messages_Uuid;
    if (lastUnreadTime) {
      const currentTimestamp = new Date(lastUnreadTime).getTime();
      messages_Uuid = `m-${currentTimestamp}`;
    }

    const updateMessageStatus = async () => {
      try {
        const payload = {
          message_uuid: messages_Uuid,
          status: 'read'
        };
        const response = await axios.put(`${EXPO_PUBLIC_API_URL}/api/chats/update-message-status`, payload);
        console.log('Message status updated:', response.data);
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    };

    if (unreadMessagesCount > 0) {
      updateMessageStatus();
    }
  };

  const handleSendMessage = async () => {
    const currentTimestamp = Date.now();
    const messages_Uuid = `m-${currentTimestamp}`;
    const uuid = chatHistory[0].uuid;

    const newMessage = {
      message_uuid: messages_Uuid,
      content: message,
      sender: "You",
      recipient_uuid: uuid,
      date: currentTimestamp,
      status: "sent"
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setLoading(true);
    try {
      const socket = getSocket();
      socket.emit('privateMessage', {
        ...newMessage,
        sender_uuid: user.uuid
      });

      await axios.post(`${EXPO_PUBLIC_API_URL}/api/chats/send-message`, {
        recipientUuid: uuid,
        content: message,
        message_uuid: messages_Uuid,
        date: currentTimestamp
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        }
      });

      setCount(count + 1);
      setLoading(false);
    } catch (error) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
      setLoading(false);
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  let typingTimeout;

const handleTyping = () => {
  const socket = getSocket();
  if (selectedMessageId && socket) {
    socket.emit('typing', {
      sender: user.uuid,
      receiver: selectedMessageId,
      senderName: user.name,
      receiverName: chatHistory[0]?.name
    });

    // Clear the last timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Emit stopTyping after 2 seconds of inactivity
    typingTimeout = setTimeout(() => {
      socket.emit('stopTyping', {
        sender: user.uuid,
        receiver: selectedMessageId,
        senderName: user.name,
        receiverName: chatHistory[0]?.name
      });
    }, 2000);
  }
};
 

  const renderMessage = ({ item }) => {
    //console.log('item',item)
    const senderInitials = item.name ? item.name.split(' ')[0].substring(0, 2).toUpperCase() : '';

    const isOnline = Array.isArray(onlineUsers)
  ? onlineUsers.includes(item.uuid)
  : !!onlineUsers[item.uuid];

    const isTypingForThisUser = selectedMessageId !== item.uuid && isReceiverTyping && item.uuid === selectedMessageId;
    
    return (
      <View style={styles.messageWrapper}>
        <TouchableOpacity style={styles.messageCard} onPress={() => handleMessagePress({ Uuid: item.uuid })}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{senderInitials}</Text>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? 'green' : 'gray' }]} />
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>{item.name}</Text>
              <Text style={styles.messageTime}>{item.role}</Text>
            </View>
            <Text
              style={[
                styles.messageText,
                item.unread_count && styles.unreadText,
                isTypingForThisUser && { fontStyle: 'italic', color: Colors.messagePrimary }
              ]}
              numberOfLines={2}
            >
              {isTypingForThisUser ? 'Typing...' : item.last_message_content}
            </Text>
          </View>
          {item.unread_count !== 0 && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </View>
    );
    
  }

  const selectedMessage = chatMembers.find((msg) => msg.uuid === selectedMessageId);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (selectedMessageId) {
    const senderInitials = selectedMessage.name ? selectedMessage.name.split(' ')[0].substring(0, 2).toUpperCase() : '';
    return (
      <View style={styles.container}>
        <View style={[styles.headerRow]}>
          <View style={[styles.avatar2, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.avatarText}>{senderInitials}</Text>
          </View>
          <Text style={styles.headerText}>{selectedMessage.name}</Text>
          {/* {onlineUsers.includes(selectedMessageId) ? (
            <Text style={{ color: 'green', fontSize: 12 }}>Online</Text>
          ) : (
            <Text style={{ color: 'gray', fontSize: 12 }}>Offline</Text>
          )} */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedMessageId(null)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {isReceiverTyping && (
          <View style={{ paddingHorizontal: 10, paddingBottom: 5 }}>
            <Text style={{ fontStyle: 'italic', color: Colors.messagePrimary }}>Typing...</Text>
          </View>
        )}

        <ScrollView
          style={styles.chatContainer}
          ref={scrollViewRef}
          onScroll={({ nativeEvent }) => {
            const { contentOffset } = nativeEvent;
            if (contentOffset.y <= 5 && !isFetchingMore) {
              setIsFetchingMore(true);
              setMessageLimit((prevLimit) => prevLimit + 10);
            }
          }}
          onContentSizeChange={() => {
            if (isFetchingMore) {
              setIsFetchingMore(false);
            }
          }}
          scrollEventThrottle={16}
        >

          {isFetchingMore && (
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: Colors.textPrimary,fontFamily:'Poppins_500Medium', }}>Loading messages...</Text>
            </View>
          )}

          {messages.map((msg) => {
            const messageContent = String(msg.content);
            const messageDate = formatDate(msg.date);

            return (
              <View
                key={`${msg.id}-${msg.message_uuid}`}
                style={[styles.messageBubble, msg.sender == "You" ? styles.sentMessage : styles.receivedMessage]}
              >
                <Text style={styles.messageText2}>{messageContent}</Text>
                <View style={styles.metaContainer}>
                  <Text style={styles.messageTime2}>{messageDate}</Text>
                  {msg.sender === "You" && (
                    <Ionicons
                      name="checkmark-done"
                      size={14}
                      color={msg.status == "read" ? 'blue' : 'black'}
                      style={{ marginLeft: 2 }}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.messageBox}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type a message"
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              handleTyping();
            }}
            showSoftInputOnFocus={allowKeyboard}
            onTouchStart={() => setAllowKeyboard(true)}
          />
          <TouchableOpacity onPress={handleSendMessage}>
            <Ionicons name="send" size={24} color={Colors.messagePrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  } else {

    return (
      <View style={styles.container}>
        <Header title="Messages" />
        <FlatList
          data={chatMembers}
          renderItem={renderMessage}
          keyExtractor={(item) => `${item.id}-${item.uuid}`}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
        {loading && <Loader loading={true} />}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    backgroundColor: Colors.white,
  },
  headerText: {
    fontSize: 22,
    //fontWeight: 'bold',
    fontFamily:'Poppins_700Bold',
    color: Colors.textPrimary,
    marginLeft: 20,
    alignItems: 'center'
  },
  messageWrapper: {
    backgroundColor: Colors.white,
    borderBottomWidth: 0,
    borderBottomColor: Colors.lightGray,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.messagePrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.messagePrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 40
  },
  avatarText: {
    fontSize: 18,
   // fontWeight: 'bold',
    fontFamily:'Poppins_700Bold',
    color: Colors.white,
    marginTop: 3,
  },
  messageContent: {
    flex: 1,
    marginLeft: 15,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 16,
    //fontWeight: '800',
    fontFamily:'Poppins_700Bold',
    color: Colors.black,
  },
  messageTime2: {
    fontSize: 12,
    fontFamily:'Poppins_400Regular',
    color: Colors.black,
  },
  messageText2: {
    fontSize: 14,
    fontFamily:'Poppins_400Regular',
    color: Colors.black,
    paddingRight: 50,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 75,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: Colors.white
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sentMessage: {
    backgroundColor: Colors.messagePrimary,
    alignSelf: 'flex-end',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  receivedMessage: {
    backgroundColor: Colors.messageGray,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  messageText: {
    fontSize: 12,
    fontFamily:'Poppins_400Regular',
    color: Colors.messageBlack,
  },
  messageTime: {
    fontSize: 12,
    fontFamily:'Poppins_400Regular',
    color: Colors.messageBlack,
    textAlign: 'right',
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.messageGray,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  input: {
    flex: 1,
    fontSize: 16,
    fontFamily:'Poppins_400Regular',
    color: Colors.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 30,
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 50,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
    marginTop: 10,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  
});


export default MessagesScreen;
