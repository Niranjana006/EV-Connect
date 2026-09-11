import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import ChatBot from '../components/Community/ChatBot';
import PeerChat from '../components/Community/PeerChat'; // This line should not be dim

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

const Community: React.FC = () => {
  const { user, isInCommunity } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isInCommunity) return;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Post[];
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, [isInCommunity]);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPostTitle && newPostContent && user && isInCommunity) {
      try {
        await addDoc(collection(db, 'posts'), {
          title: newPostTitle,
          content: newPostContent,
          author: user.email,
          createdAt: new Date(),
          comments: []
        });
        setNewPostTitle('');
        setNewPostContent('');
      } catch (error) {
        console.error('Post Error:', error);
      }
    }
  };

  const handleAddComment = async (postId: string, comment: string) => {
    if (comment && user && isInCommunity) {
      try {
        const postRef = doc(db, 'posts', postId);
        const postSnapshot = await getDoc(postRef);
        const post = postSnapshot.data() as Post;
        const updatedComments = [...post.comments, {
          id: Date.now().toString(),
          content: comment,
          author: user.email,
          createdAt: new Date()
        }];
        await updateDoc(postRef, { comments: updatedComments });
        setNewComment(prev => ({ ...prev, [postId]: '' }));
      } catch (error) {
        console.error('Comment Error:', error);
      }
    }
  };

  if (!user) return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Community</h1>
      <p>Please log in to view the community.</p>
      <ChatBot />
    </div>
  );
  if (!isInCommunity) return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Community</h1>
      <p>Join the community from the navbar to participate.</p>
      <ChatBot />
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Community</h1>
      
      <form onSubmit={handleAddPost} className="bg-white p-4 rounded-lg shadow-md mb-4">
        <input
          type="text"
          id="post-title"
          name="post-title"
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
          placeholder="Post Title"
          className="border p-2 w-full mb-2 rounded"
        />
        <textarea
          id="post-content"
          name="post-content"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="What's on your mind?"
          className="border p-2 w-full mb-2 rounded h-20"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={!isInCommunity}
        >
          Post
        </button>
      </form>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">{post.title}</h3>
            <p className="mb-2">{post.content}</p>
            <p className="text-sm text-gray-500 mb-4">By {post.author} on {post.createdAt.toLocaleString()}</p>
            
            <div className="space-y-2">
              {post.comments.map((comment) => (
                <div key={comment.id} className="border-l-2 pl-2 border-blue-300">
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-gray-500">By {comment.author} on {comment.createdAt.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddComment(post.id, newComment[post.id] || '');
            }} className="mt-4">
              <input
                type="text"
                id={`comment-${post.id}`}
                name={`comment-${post.id}`}
                value={newComment[post.id] || ''}
                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                placeholder="Add a comment..."
                className="border p-2 w-full rounded"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2"
                disabled={!isInCommunity}
              >
                Comment
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <ChatBot />
        <PeerChat /> {/* This should now render */}
      </div>
    </div>
  );
};

export default Community;