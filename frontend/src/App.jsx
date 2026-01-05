import { useState, useEffect } from 'react';
import './App.css';

const USE_COOKIES = false;
const USE_WIZARD = true;

function App() {
  const [voterName, setVoterName] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(0); // 0 = welcome, 1+ = categories, final = thank you
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
      const response = await fetch('/api/getCategories');
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

    const cookie = document.cookie.split('; ').find(row => row.startsWith('votedCategories='));

    if (cookie) {
      const voted = JSON.parse(cookie.split('=')[1]);
      setVotedCategories(voted);
    }
  };

  const saveVotedCategoriesToCookie = categoryIds => {
    if (!USE_COOKIES) return;
    document.cookie = `votedCategories=${JSON.stringify(categoryIds)}; max-age=${
      60 * 60 * 24 * 30
    }; path=/`;
  };

  const handleNomineeSelect = (categoryId, nomineeId) => {
    setSelectedNominees(prev => ({
      ...prev,
      [categoryId]: nomineeId,
    }));
  };

  const handleNext = () => {
    if (currentStep === 0 && !voterName.trim()) {
      alert('Please enter your name first!');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleSkip = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleVote = async categoryId => {
    // Check if option is selected
    if (!selectedNominees[categoryId]) {
      setMessages(prev => ({
        ...prev,
        [categoryId]: '⚠️ Please select an option!',
      }));
      return;
    }

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomineeId: selectedNominees[categoryId],
          voterName: voterName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add to voted categories
        const newVotedCategories = [...votedCategories, categoryId];
        setVotedCategories(newVotedCategories);
        saveVotedCategoriesToCookie(newVotedCategories);

        // Move to next step
        setCurrentStep(prev => prev + 1);
      } else {
        setMessages(prev => ({
          ...prev,
          [categoryId]: '❌ Error: ' + data.error,
        }));
      }
    } catch (error) {
      setMessages(prev => ({
        ...prev,
        [categoryId]: '❌ Failed to vote: ' + error.message,
      }));
    }
  };

  if (loading) {
    return (
      <div className="App">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!USE_WIZARD) {
    return (
      <div className="App">
        {/* Welcome Screen */}
        <div
          style={{
            maxWidth: '500px',
            margin: '0 auto 60px auto',
            padding: '40px',
          }}
        >
          <h1
            style={{
              fontWeight: '600',
            }}
          >
            {' '}
            Welcome to the Ambivalence Awards
          </h1>
          <div className="gradient-box">
            <p style={{ fontWeight: 'bold', marginBottom: '30px' }}>What's your name?</p>

            <input
              type="text"
              value={voterName}
              onChange={e => setVoterName(e.target.value)}
              placeholder="Enter your name"
              style={{
                padding: '12px',
                marginBottom: '20px',
                borderRadius: '8px',
                fontSize: '18px',
                border: '2px solid var(--color-gray-medium)',
                width: '100%',
                boxSizing: 'border-box',
                WebkitBoxSizing: 'border-box',
                MozBoxSizing: 'border-box',
              }}
            />
            <div>
              <button
                style={{
                  fontWeight: 'bold',
                  padding: '10px 20px',
                  backgroundColor: 'rgb(34, 105, 251)',
                  boxShadow: '3px 3px 10px 2px rgba(0, 0, 0, 0.25)',
                  border: '0',
                  color: 'white',
                }}
              >
                Next →
              </button>
            </div>
            <span style={{ fontWeight: '400', fontSize: '12px' }}>
              Don't worry, no one will see this.
            </span>
          </div>
        </div>

        {/* All Category Screens */}
        {categories.map((category, index) => (
          <div key={category.id} className="vote-card">
            <div
              style={{
                marginBottom: '10px',
                color: 'var(--color-gray-dark)',
                fontSize: '14px',
              }}
            >
              Question {index + 1} of {categories.length}
            </div>
            <div className="progress-bar"></div>
            <h1>{category.name}</h1>

            <div
              style={{
                marginTop: '30px',
                textAlign: 'left',
              }}
            >
              {category.nominees.map(nominee => (
                <label
                  key={nominee.id}
                  className={`nominee-option ${
                    selectedNominees[category.id] === nominee.id ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={`category-${category.id}`}
                    value={nominee.id}
                    checked={selectedNominees[category.id] === nominee.id}
                    onChange={() => handleNomineeSelect(category.id, nominee.id)}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{ fontSize: '16px' }}>{nominee.name}</span>
                </label>
              ))}
            </div>

            {messages[category.id] && <p className="error-message">{messages[category.id]}</p>}

            <div
              style={{
                marginTop: '30px',
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
              }}
            >
              <button className="skip">Skip</button>
              <button className="submit">Submit Vote</button>
            </div>
          </div>
        ))}

        {/* Thank You Screen */}
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '40px',
          }}
        >
          <h1>Thank You, {voterName || '[Name]'}!</h1>
          <p style={{ fontSize: '18px', marginTop: '20px' }}>Your votes have been recorded.</p>

          <div
            className="vote-card"
            style={{
              marginTop: '40px',
              textAlign: 'left',
              padding: '20px',
            }}
          >
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Your Votes:</h3>

            {categories.map(category => {
              const votedNomineeId = selectedNominees[category.id];
              const votedNominee = category.nominees.find(n => n.id === votedNomineeId);

              return (
                <div
                  key={category.id}
                  className={`vote-recap-card ${votedNominee ? 'voted' : 'skipped'}`}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{category.name}</div>
                  <div className={votedNominee ? 'vote-text-success' : 'vote-text-muted'}>
                    {votedNominee ? `✓ ${votedNominee.name}` : '— Skipped'}
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: '14px', color: 'var(--color-gray-dark)', marginTop: '20px' }}>
            You voted on {votedCategories.length} out of {categories.length} categories.
          </p>
        </div>
      </div>
    );
  }

  // Welcome screen
  if (currentStep === 0) {
    return (
      <div className="App">
        <div
          style={{
            maxWidth: '500px',
            margin: '0 auto 60px auto',
            padding: '40px',
          }}
        >
          <h1>Welcome to the Ambivalence Awards!</h1>
          <div className="gradient-box">
            <p style={{ fontWeight: 'bold', marginBottom: '30px' }}>What's your name?</p>

            <input
              type="text"
              value={voterName}
              onChange={e => setVoterName(e.target.value)}
              placeholder="Enter your name"
              style={{
                padding: '12px',
                marginBottom: '20px',
                borderRadius: '8px',
                fontSize: '18px',
                border: '2px solid var(--color-gray-medium)',
                width: '100%',
                boxSizing: 'border-box',
                WebkitBoxSizing: 'border-box',
                MozBoxSizing: 'border-box',
              }}
              onKeyPress={e => {
                if (e.key === 'Enter') handleNext();
              }}
            />

            <div>
              <button
                onClick={handleNext}
                style={{
                  fontWeight: 'bold',
                  padding: '10px 20px',
                  backgroundColor: 'rgb(34, 105, 251)',
                  boxShadow: '3px 3px 10px 2px rgba(0, 0, 0, 0.25)',
                  border: '0',
                  color: 'white',
                }}
              >
                Next →
              </button>
            </div>
            <span style={{ fontWeight: '400', fontSize: '12px' }}>
              Don't worry, no one will see this.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Category screens
  const categoryIndex = currentStep - 1;
  if (categoryIndex < categories.length) {
    const category = categories[categoryIndex];

    return (
      <div className="App">
        <div className="vote-card">
          {/* Progress indicator */}
          <div
            style={{
              marginBottom: '10px',
              color: 'var(--color-gray-dark)',
              fontSize: '14px',
            }}
          >
            Question {currentStep} of {categories.length}
          </div>
          <div className="progress-bar"></div>
          <h1>{category.name}</h1>

          <div
            style={{
              marginTop: '30px',
              textAlign: 'left',
            }}
          >
            {category.nominees.map(nominee => (
              <label
                key={nominee.id}
                className={`nominee-option ${
                  selectedNominees[category.id] === nominee.id ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name={`category-${category.id}`}
                  value={nominee.id}
                  checked={selectedNominees[category.id] === nominee.id}
                  onChange={() => handleNomineeSelect(category.id, nominee.id)}
                  style={{ marginRight: '10px' }}
                />
                <span style={{ fontSize: '16px' }}>{nominee.name}</span>
              </label>
            ))}
          </div>

          {messages[category.id] && <p className="error-message">{messages[category.id]}</p>}

          <div
            style={{
              marginTop: '30px',
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
            }}
          >
            <button className="skip" onClick={handleSkip}>
              Skip
            </button>
            <button className="submit" onClick={() => handleVote(category.id)}>
              Submit Vote
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Thank you screen
  return (
    <div className="App">
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '40px',
        }}
      >
        <h1>Thank You, {voterName}!</h1>
        <p style={{ fontSize: '18px', marginTop: '20px' }}>Your votes have been recorded.</p>

        <div
          className="vote-card"
          style={{
            marginTop: '40px',
            textAlign: 'left',
            padding: '20px',
          }}
        >
          <h3 style={{ marginBottom: '20px' }}>Your Votes:</h3>

          {categories.map(category => {
            const votedNomineeId = selectedNominees[category.id];
            const votedNominee = category.nominees.find(n => n.id === votedNomineeId);

            return (
              <div
                key={category.id}
                style={{
                  marginBottom: '15px',
                  padding: '15px',
                  borderRadius: '8px',
                  border: votedNominee ? '2px solid #4CAF50' : 'px solid #ddd',
                  backgroundColor: '#262a34',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{category.name}</div>
                <div className={votedNominee ? 'vote-text-success' : 'vote-text-muted'}>
                  {votedNominee ? `✓ ${votedNominee.name}` : '— Skipped'}
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: '14px', color: 'var(--color-gray-dark)', marginTop: '20px' }}>
          You voted on {votedCategories.length} out of {categories.length} categories.
        </p>
      </div>
    </div>
  );
}

export default App;
