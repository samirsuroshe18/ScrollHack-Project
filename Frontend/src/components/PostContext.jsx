import React, { createContext, useState, useContext } from 'react';


const PostContext = createContext();


export const PostProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);

    const addPost = (newPost) => {
        setPosts((prevPosts) => [...prevPosts, newPost]);
        console.log('Post added:', newPost); // Debugging line
    };

    return (
        <PostContext.Provider value={{ posts, addPost }}>
            {children}
        </PostContext.Provider>
    );
};


export const usePosts = () => {
    return useContext(PostContext);
};
