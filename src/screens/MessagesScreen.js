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


const MessagesScreen = () => {
  const [selectedMessageId, setSelectedMessageId] = useState();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatMembers, setChatMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatHistories, setChatHistories] = useState([])
  const [count, setCount] = useState(0);
  const [messageLimit, setMessageLimit] = useState(10);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allowKeyboard, setAllowKeyboard] = useState(false);

  const chatMembersRef = useRef();
  const scrollViewRef = useRef();
  const inputRef = useRef(null);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const Loading = useSelector((state) => state.ui.loading);

  useEffect(() => {
    getChatMembers();
  }, []);


  useEffect(() => {
    const backAction = () => {
      if (selectedMessageId !== null) {
        setSelectedMessageId(null);
        getChatMembers();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

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
      } else {
        console.error("Error : Data not Comming");
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
  }, [chatMembers, messageLimit]);

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
          const recipientUuid = member.uuid;
          const messageUuid = '';

          const response = await axios.get(
            `${EXPO_PUBLIC_API_URL}/api/chats/get-chat-history?recipientUuid=${recipientUuid}&limit=${limit}&messageUuid=${messageUuid}`
          );

          return response.data;
        })
      );

      const flattenedHistories = histories.flat();

      setChatHistories((prevHistories) => {
        const newMessages = flattenedHistories.filter(
          msg => !prevHistories.some(prev => prev.message_uuid === msg.message_uuid)
        );
        const combined = [...prevHistories, ...newMessages];
        combined.sort((a, b) => new Date(a.date) - new Date(b.date));
        return combined;
      });

      if (selectedMessageId) {
        const updatedMessages = flattenedHistories.filter(
          (msg) =>
            msg.sender_uuid === selectedMessageId ||
            msg.recipient_uuid === selectedMessageId
        );

        setMessages((prevMessages) => {
          const uniqueMessages = updatedMessages.filter(
            (msg) =>
              !prevMessages.some(
                (prev) => prev.message_uuid === msg.message_uuid
              )
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
    const selectedMessages = chatHistories.filter((msg) => msg.sender_uuid === Uuid || msg.recipient_uuid === Uuid);
    const selectChatHistory = chatMembers.filter((msg) => msg.uuid === Uuid);
    setMessages(selectedMessages);
    setChatHistory(selectChatHistory);
  };

  const handleSendMessage = async () => {
    const currentTimestamp = Date.now();
    const messages_Uuid = `m-${currentTimestamp}`
    const uuid = chatHistory[0].uuid;

    const newMessage = {
      message_uuid: messages_Uuid,
      content: message,
      sender: "You",
      recipient_uuid: uuid,
      date: currentTimestamp,
      status: "sent",
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    setLoading(true);
    try {
      const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/chats/send-message`, {
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
    setMessage('');
    useEffect(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [selectedMessageId]);
  };

  const renderMessage = ({ item }) => {
    const senderInitials = item.name ? item.name.split(' ')[0].substring(0, 2).toUpperCase() : '';

    return (
      <View style={styles.messageWrapper}>
        <TouchableOpacity style={styles.messageCard} onPress={() => handleMessagePress({ Uuid: item.uuid })}>
          <View
            style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}
          >
            <Text style={styles.avatarText}>{senderInitials}</Text>
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>{item.name}</Text>
              <Text style={styles.messageTime}>{item.role}</Text>
            </View>
            <Text style={[styles.messageText, item.unread_count && styles.unreadText]} numberOfLines={2}>
              {item.last_message_content}
            </Text>
          </View>
          {item.unread_count != 0 && <View style={styles.unreadDot} />}
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
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedMessageId(null)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>


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
              <Text style={{ color: Colors.textPrimary }}>Loading messages...</Text>
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
            onChangeText={setMessage}
            showSoftInputOnFocus={allowKeyboard}
            onTouchStart={() => setAllowKeyboard(true)}
          />
          <TouchableOpacity onPress={handleSendMessage}>
            <Ionicons name="send" size={24} color={Colors.messagePrimary} />
          </TouchableOpacity>
        </View>
        {loading && <Loader loading={true} />}
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: Colors.white,
  },
  messageContent: {
    flex: 1,
    marginLeft: 15,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.black,
  },
  messageTime2: {
    fontSize: 12,
    color: Colors.black,
  },
  messageText2: {
    fontSize: 14,
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
    color: Colors.messageBlack,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.messageBlack,
    marginTop: 5,
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
});


export default MessagesScreen;
