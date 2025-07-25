
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { CodeInputPanel } from './components/CodeInputPanel';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { reviewCode } from './services/geminiService';
import { getRepos, getUser } from './services/githubService';
import { GithubAuthModal } from './components/GithubAuthModal';

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // GitHub Integration State
  const [githubToken, setGithubToken] = useState<string | null>(() => sessionStorage.getItem('github_pat'));
  const [githubUser, setGithubUser] = useState<any | null>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(false);

  useEffect(() => {
    const fetchGithubData = async () => {
      if (githubToken) {
        try {
          const user = await getUser(githubToken);
          setGithubUser(user);
          setIsLoadingRepos(true);
          const userRepos = await getRepos(githubToken);
          setRepos(userRepos);
        } catch (err) {
          console.error('Failed to fetch GitHub data:', err);
          handleLogout(); // Log out if token is invalid
          setError('Failed to authenticate with GitHub. Please check your token.');
        } finally {
            setIsLoadingRepos(false);
        }
      }
    };
    fetchGithubData();
  }, [githubToken]);

  const handleLogin = (token: string) => {
    sessionStorage.setItem('github_pat', token);
    setGithubToken(token);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('github_pat');
    setGithubToken(null);
    setGithubUser(null);
    setRepos([]);
  };

  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code to review.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setFeedback('');

    try {
      const result = await reviewCode(code, language);
      setFeedback(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get review: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [code, language]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      {isAuthModalOpen && <GithubAuthModal onLogin={handleLogin} onClose={() => setIsAuthModalOpen(false)} />}
      <Header 
        user={githubUser}
        onConnect={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-3/5 flex flex-col">
          <CodeInputPanel
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            onReview={handleReview}
            isLoading={isLoading}
            // GitHub props
            githubToken={githubToken}
            repos={repos}
            isLoadingRepos={isLoadingRepos}
          />
        </div>
        <div className="lg:w-2/5 flex flex-col">
          <FeedbackDisplay 
            feedback={feedback}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
