import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Platform, ScrollView, RefreshControl, KeyboardAvoidingView, Animated, Keyboard } from 'react-native';
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
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useKeyboardTabBarEffect from '../hooks/useKeyboardTabBarEffect';
import { logError } from '../components/logError';


dayjs.extend(calendar);

const buildTimedFeed = (msgs = []) => {
  const feed = [];
  let lastDay = null;

  msgs.forEach((m) => {
    const dayKey = dayjs(m.date).format('YYYY-MM-DD');

    if (dayKey !== lastDay) {
      feed.push({
        _type: 'separator',
        id: `sep-${dayKey}`,
        label: dayjs(m.date).calendar(undefined, {
          sameDay: '[Today]',
          lastDay: '[Yesterday]',
          lastWeek: 'ddd, D MMM YYYY',
          sameElse: 'D MMM YYYY',
        }),
      });
      lastDay = dayKey;
    }

    feed.push({ _type: 'message', ...m });
  });

  return feed;
};

const markMessageRead = async (message_uuid) => {
  try {
    await axios.put(`${EXPO_PUBLIC_API_URL}/api/chats/update-message-status`, {
      message_uuid,
      status: 'read',
    });
  } catch (err) {
    console.warn('Error updating status:', err.response?.data || err.message);
     await logError({
            error: err,
            data: err.response?.data || err.message,
            details: "Error in update-message-status API call on MessagesScreen"
          });
  }
};

const MessagesScreen = () => {
  useKeyboardTabBarEffect();
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
  const [online, setOnline] = useState(false);
  const [isReceiverTyping, setIsReceiverTyping] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [inputMarginBottom, setInputMarginBottom] = useState(15);
  const [selectedChat, setSelectedChat] = useState(null);

  const timeline = useMemo(() => buildTimedFeed(messages), [messages]);

  const chatMembersRef = useRef();
  const scrollViewRef = useRef();
  const inputRef = useRef(null);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const Loading = useSelector((state) => state.ui.loading);
  const unreadMessagesCount = useSelector((state) => state.header.unreadMessagesCount);
  const unreadMessages = useSelector((state) => state.header.unreadMessages);
  const user = useSelector((state) => state.auth);
  
  useFocusEffect(
    useCallback(() => {
      const beforeRemoveListener = navigation.addListener('beforeRemove', (e) => {
        if (selectedMessageId !== null) {
          e.preventDefault(); 
          setSelectedMessageId(null);
          getChatMembers();
  
          setTimeout(() => {
            navigation.dispatch(e.data.action);
          }, 0);
        }
      });
  
      return () => beforeRemoveListener();
    }, [selectedMessageId, navigation])
  );  

  useEffect(() => {
    navigation.setOptions({  tabBarStyle: selectedChat
      ? { display: 'none' }
      : {
          display: 'flex',
          position: 'absolute',
          borderTopColor: Colors.border,
          paddingTop: 5,
          paddingBottom: 5,
          height: 65,
          backgroundColor: 'white'
        },
    });
  }, [selectedChat]);
  
  useEffect(() => {
    getChatMembers();
  }, [unreadMessagesCount]);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100); 
    });
  
    return () => keyboardDidShow.remove();
  }, []);
  

  useEffect(() => {
    const userUuid = user.uuid;
    const socket = connectSocket(userUuid);

    if (socket.connected) {
      //console.log('✅ Socket is connected');
    } else {
      //console.log('❌ Socket is NOT connected');
    }

    socket.emit('register', userUuid);

    socket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    socket.on('userStatus', ({ username, status }) => {
      setOnlineUsers((prevUsers) => {
        const updatedUsers = { ...prevUsers, [username]: status };
        return updatedUsers;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const normalizeMsg = (raw) => ({
    message_uuid: raw.message_uuid || raw.messageId,
    content: raw.content,
    date: raw.date,
    sender_uuid: raw.senderId,
    sender: raw.sender,
    recipient_uuid: selectedMessageId,
    status: raw.status || 'sent',
  });


  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("privateMessage", (raw) => {
      const msg = normalizeMsg(raw);
      const isInCurrentChat =
        msg.sender_uuid === selectedMessageId ||
        msg.receiverName === selectedMessageId;

      if (isInCurrentChat) {
        setMessages((prev) =>
          prev.some((m) => m.message_uuid === msg.message_uuid) ? prev : [...prev, msg]
        );        
        if (msg.sender_uuid !== user.uuid && msg.status === 'sent') {
          setMessages((prev) =>
            prev.map((m) =>
              m.message_uuid === msg.message_uuid ? { ...m, status: 'read' } : m
            )
          );

          markMessageRead(msg.message_uuid);
        }

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    socket.on("messageStatus", ({ message_uuid, status }) => {

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.message_uuid === message_uuid
            ? { ...msg, status }
            : msg
        )
      );
    });

    socket.on('typing', (data) => {

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
        setSelectedChat(null)
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
      await logError({
        error: err,
        data: err.response?.data || err.message,
        details: "Error in get-chat-members API call on MessagesScreen"
      });
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
  }, [chatMembers, messageLimit, unreadMessagesCount, messages]);

  const getChatHistory = async (limit = 10) => {
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
      await logError({
        error: err,
        data: err.response?.data || err.message,
        details: "Error in get-chat-history API call on MessagesScreen"
      });
    }
  };


  const handleMessagePress = ({ Uuid }) => {
    setSelectedMessageId(Uuid);

    const selectedMessages = chatHistories.filter(msg =>
      msg.sender_uuid === Uuid || msg.recipient_uuid === Uuid
    );
    const selectChatHistory = chatMembers.filter(msg => msg.uuid === Uuid);
    setMessages(selectedMessages);
    setChatHistory(selectChatHistory);

    const sentMessages = selectedMessages.filter(msg => msg.status === 'sent');

    const updateMessageStatus = async (message_uuid) => {
      try {
        const payload = {
          message_uuid: message_uuid,
          status: 'read'
        };
        const response = await axios.put(`${EXPO_PUBLIC_API_URL}/api/chats/update-message-status`, payload);
      } catch (error) {
        console.error(`Error updating message ${message_uuid}:`, error.response?.data || error.message);
        await logError({
          error: error,
          data: `Error updating message ${message_uuid}:${error.response.data || error.message}`,
          details: "Error in update-message-status API call on MessagesScreen"
        });
      }
    };

    if (sentMessages.length > 0) {
      sentMessages.forEach(msg => {
        updateMessageStatus(msg.message_uuid);
      });
    }
  };


  const handleSendMessage = async () => {
    const currentTimestamp = Date.now();
    const messages_Uuid = `m-${currentTimestamp}`;
    const uuid = chatHistory[0].uuid;

    const newMessage = {
      message_uuid: messages_Uuid,
      content: message.trim(),
      sender: "You",
      recipient_uuid: uuid,
      date: currentTimestamp,
      status: "sent",
    };

    if (!newMessage.content) return;

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setLoading(true);
    try {
      const socket = getSocket();
      socket.emit('privateMessage', {
        ...newMessage,
        sender_uuid: user.uuid,
      });

      await axios.post(`${EXPO_PUBLIC_API_URL}/api/chats/send-message`, {
        recipientUuid: uuid,
        content: newMessage.content,
        message_uuid: messages_Uuid,
        date: currentTimestamp,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      setCount((prevCount) => prevCount + 1);
    } catch (error) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
      await logError({
        error: error,
        data: error.response ? error.response.data : error.message,
        details: "Error in send-message API call on MessagesScreen"
      });
    } finally {
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

      if (typingTimeout) clearTimeout(typingTimeout);

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
    const senderInitials = item.name ? item.name.split(' ')[0].substring(0, 2).toUpperCase() : '';

    const isOnline = Array.isArray(onlineUsers)
      ? onlineUsers.includes(item.uuid)
      : !!onlineUsers[item.uuid];

    const isTypingForThisUser = selectedMessageId !== item.uuid && isReceiverTyping && item.uuid === selectedMessageId;

    return (
      <View style={styles.messageWrapper}>
        <TouchableOpacity style={styles.messageCard} onPress={() => {
            setSelectedChat(item);
            handleMessagePress({ Uuid: item.uuid });
          }}>
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

  if (selectedMessageId && selectedChat) {
    const senderInitials = selectedMessage.name ? selectedMessage.name.split(' ')[0].substring(0, 2).toUpperCase() : '';
    const partnerOnline = Array.isArray(onlineUsers)
      ? onlineUsers.includes(selectedMessageId)
      : !!onlineUsers[selectedMessageId];
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.white, paddingTop: Platform.OS === 'ios' ? 10 : 10,}}>
        <View style={[styles.headerRow]}>
          <View style={[styles.avatar2, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.avatarText}>{senderInitials}</Text>
          </View>
          <View style={styles.nameStatusBlock}>
            <Text style={styles.headerText}>{selectedMessage.name}</Text>
            <Text
              style={[
                styles.headerStatus,
                {
                  color: isReceiverTyping ? Colors.messagePrimary
                    : partnerOnline ? 'green' : 'gray'
                },
              ]}
            >
              {isReceiverTyping ? 'Typing…'
                : partnerOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={() => {
            console.log('Back pressed');
            setSelectedMessageId(null);
            setSelectedChat(null)}}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        </SafeAreaView>

        <ScrollView
          style={styles.chatContainer}
          contentContainerStyle={{ paddingBottom: 15 }}
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
          keyboardShouldPersistTaps="handled"
        >

          {isFetchingMore && (
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: Colors.textPrimary, fontFamily: 'Poppins_500Medium', }}>Loading messages...</Text>
            </View>
          )}

          {timeline.map((item) => {
            if (item._type === 'separator') {
              return (
                <View key={item.id} style={styles.dayChip}>
                  <Text style={styles.dayChipText}>{item.label}</Text>
                </View>
              );
            }

            const messageContent = String(item.content);
            const messageDate = formatDate(item.date);

            return (
              <View
                key={`${item.id || item.message_uuid}`}
                style={[
                  styles.messageBubble,
                  item.sender === 'You' ? styles.sentMessage : styles.receivedMessage,
                ]}
              >
                <Text style={styles.messageText2}>{messageContent}</Text>
                <View style={styles.metaContainer}>
                  <Text style={styles.messageTime2}>{messageDate}</Text>
                  {item.sender === 'You' && (
                    <Ionicons
                      name="checkmark-done"
                      size={14}
                      color={item.status === 'read' ? 'blue' : 'black'}
                      style={{ marginLeft: 2 }}
                    />
                  )}
                </View>
              </View>
            );
          })}

        </ScrollView>

        <View style={[styles.messageBox]}>
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
            onTouchStart={() => {setAllowKeyboard(true); var bottom=25}}
          />
          <TouchableOpacity onPress={handleSendMessage}>
            <Ionicons name="send" size={24} color={Colors.messagePrimary} />
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
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
          keyboardShouldPersistTaps="handled"
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
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
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
    fontFamily: 'Poppins_700Bold',
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
    fontFamily: 'Poppins_700Bold',
    color: Colors.black,
  },
  messageTime2: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
  },
  messageText2: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
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
    fontFamily: 'Poppins_400Regular',
    color: Colors.messageBlack,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
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
    marginHorizontal:15,
    marginBottom:40,
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
    fontFamily: 'Poppins_400Regular',
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
    zIndex: 999,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 50,
    marginTop:10,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingBottom:10,
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
  dayChip: {
    alignSelf: 'center',
    backgroundColor: Colors.messageGray,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 6,
  },
  dayChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textPrimary,
  },
  nameStatusBlock: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 0,
    paddingTop: 0,
    lineHeight: 14,
  },
});
export default MessagesScreen;
