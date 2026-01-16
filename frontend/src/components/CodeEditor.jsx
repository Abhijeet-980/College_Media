import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react'; // Requires npm install @monaco-editor/react
import { io } from 'socket.io-client';

const CodeEditor = ({ roomId, token, currentUser }) => {
    const [code, setCode] = useState('// Start coding here...');
    const [language, setLanguage] = useState('javascript');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [collaborators, setCollaborators] = useState([]);

    const socketRef = useRef(null);
    const editorRef = useRef(null);

    useEffect(() => {
        // Connect to Socket.io
        socketRef.current = io('http://localhost:5000/code-editor', {
            auth: { token },
            transports: ['websocket']
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Connected to Code Editor');
            socket.emit('join-room', roomId);
        });

        socket.on('init-state', (state) => {
            setCode(state.code);
            setLanguage(state.language);
            setCollaborators(state.users);
        });

        socket.on('code-change', (data) => {
            // Only update if content is different to avoid cursor jump
            if (editorRef.current && editorRef.current.getValue() !== data.code) {
                // This is a simple update, for real OT utilize Y.js binding
                editorRef.current.setValue(data.code);
            }
        });

        socket.on('language-change', (data) => {
            setLanguage(data.language);
        });

        socket.on('user-joined', (user) => {
            setCollaborators(prev => [...prev, user]);
            console.log(`${user.username} joined`);
        });

        socket.on('user-left', (user) => {
            setCollaborators(prev => prev.filter(u => u.socketId !== user.socketId));
        });

        socket.on('execution-start', () => setIsRunning(true));

        socket.on('execution-result', (result) => {
            setIsRunning(false);
            if (result.success) {
                setOutput(result.output || 'No output');
            } else {
                setOutput(`Error: ${result.error}`);
            }
        });

        socket.on('execution-error', (data) => {
            setIsRunning(false);
            setOutput(`Error: ${data.error}`);
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId, token]);

    // Handle Local Changes
    const handleEditorChange = (value) => {
        setCode(value);
        socketRef.current.emit('code-change', { roomId, code: value });
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        socketRef.current.emit('language-change', { roomId, language: newLang });
    };

    const runCode = () => {
        setOutput('Running...');
        socketRef.current.emit('run-code', { roomId, code, language });
    };

    return (
        <div className="flex bg-gray-900 text-white h-screen">
            {/* Sidebar / Collaborators */}
            <div className="w-64 bg-gray-800 p-4 border-r border-gray-700">
                <h2 className="text-xl font-bold mb-4">Room: {roomId}</h2>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Collaborators</h3>
                <ul>
                    {collaborators.map((user, idx) => (
                        <li key={idx} className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs">
                                {user.username[0].toUpperCase()}
                            </div>
                            <span>{user.username} {user.userId === currentUser.id && '(You)'}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4">
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="bg-gray-700 text-white px-3 py-1 rounded"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                        <option value="go">Go</option>
                    </select>

                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className={`px-4 py-1 rounded font-bold ${isRunning ? 'bg-gray-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {isRunning ? 'Running...' : 'Run ▶'}
                    </button>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden">
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={language}
                        value={code}
                        onChange={handleEditorChange}
                        onMount={(editor) => { editorRef.current = editor; }}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                        }}
                    />
                </div>

                {/* Terminal / Output */}
                <div className="h-48 bg-black border-t border-gray-700 flex flex-col">
                    <div className="bg-gray-800 px-4 py-1 text-xs text-gray-400">Terminal</div>
                    <pre className="p-4 font-mono text-sm text-green-400 overflow-auto flex-1">
                        {output}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
