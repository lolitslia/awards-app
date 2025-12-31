import { useState, useEffect } from 'react';
import './App.css';

const USE_COOKIES = false;

function App() {
  const [voterName, setVoterName] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedNominees, setSelectedNominees] = useState({});
  const [votedCategories, setVotedCategories] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
    loadVotedCategoriesFromCookie();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8888/api/getCategories');
      const data = await response.json();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setLoading(false);
    }
  };

const loadVotedCategoriesFromCookie = () => {
  if (!USE_COOKIES) return;
  
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('votedCategories='));
  
  if (cookie) {
    const voted = JSON.parse(cookie.split('=')[1]);
    setVotedCategories(voted);
  }
};

const saveVotedCategoriesToCookie = (categoryIds) => {
  if (!USE_COOKIES) return;
  
  document.cookie = `votedCategories=${JSON.stringify(categoryIds)}; max-age=${60*60*24*30}; path=/`;
};

  const handleNomineeSelect = (categoryId, nomineeId) => {
    setSelectedNominees(prev => ({
      ...prev,
      [categoryId]: nomineeId
    }));
  };

  const handleVote = async (categoryId) => {
    // Clear previous message for this category
    setMessages(prev => ({ ...prev, [categoryId]: '' }));

    // Check if name is entered
    if (!voterName.trim()) {
      setMessages(prev => ({
        ...prev,
        [categoryId]: '⚠️ Please enter your name at the top first!'
      }));
      return;
    }

    // Check if option is selected
    if (!selectedNominees[categoryId]) {
      setMessages(prev => ({
        ...prev,
        [categoryId]: '⚠️ Please select an option!'
      }));
      return;
    }

    try {
      const response = await fetch('http://localhost:8888/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomineeId: selectedNominees[categoryId],
          voterName: voterName.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => ({
          ...prev,
          [categoryId]: '✅ Vote recorded!'
        }));
        
        // Add to voted categories
        const newVotedCategories = [...votedCategories, categoryId];
        setVotedCategories(newVotedCategories);
        saveVotedCategoriesToCookie(newVotedCategories);
      } else {
        setMessages(prev => ({
          ...prev,
          [categoryId]: '❌ Error: ' + data.error
        }));
      }
    } catch (error) {
      setMessages(prev => ({
        ...prev,
        [categoryId]: '❌ Failed to vote: ' + error.message
      }));
    }
  };

  if (loading) {
    return <div className="App"><h1>Loading...</h1></div>;
  }

  return (
    <div className="App">
      <h1>🏆 Awards Voting</h1>
      
      {/* Name input */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <label style={{ fontSize: '18px', fontWeight: 'bold' }}>
          Your Name: 
          <input 
            type="text" 
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="Enter your name"
            style={{ 
              marginLeft: '10px', 
              padding: '8px', 
              fontSize: '16px',
              width: '250px'
            }}
          />
        </label>
      </div>

      {/* Categories */}
      {categories.map(category => {
        const hasVoted = votedCategories.includes(category.id);
        
        return (
          <div 
            key={category.id} 
            style={{ 
              marginBottom: '40px', 
              padding: '20px', 
              border: '2px solid #ddd',
              borderRadius: '8px',
              opacity: hasVoted ? 0.6 : 1,
              background: hasVoted ? '#1a1a1a' : 'transparent'
            }}
          >
            <h2>{category.name}</h2>
            
            {category.nominees.map(nominee => (
              <label 
                key={nominee.id} 
                style={{ display: 'block', marginBottom: '10px' }}
              >
                <input 
                  type="radio" 
                  name={`category-${category.id}`}
                  value={nominee.id}
                  checked={selectedNominees[category.id] === nominee.id}
                  onChange={() => handleNomineeSelect(category.id, nominee.id)}
                  disabled={hasVoted}
                />
                {' '}{nominee.name}
              </label>
            ))}

            <button 
              onClick={() => handleVote(category.id)}
              disabled={hasVoted}
              style={{ 
                marginTop: '15px',
                padding: '10px 20px',
                fontSize: '16px',
                cursor: hasVoted ? 'not-allowed' : 'pointer'
              }}
            >
              {hasVoted ? 'Already Voted' : 'Submit Vote'}
            </button>

            {messages[category.id] && (
              <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
                {messages[category.id]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default App;