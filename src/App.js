import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTrash, faRedo, faFilePdf, faTimes, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const App = () => {
  const [userInput, setUserInput] = useState('');
  const [story, setStory] = useState('');
  const [summary, setSummary] = useState('');
  const [startImageUrl, setStartImageUrl] = useState(null);
  const [middleImageUrl, setMiddleImageUrl] = useState(null);
  const [endImageUrl, setEndImageUrl] = useState(null);
  const [storyName, setStoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const splitStoryIntoThreeParts = (story) => {
    const paragraphs = story.split('\n\n');
    const third = Math.floor(paragraphs.length / 3);
    const start = paragraphs.slice(0, third).join('\n\n');
    const middle = paragraphs.slice(third, 2 * third).join('\n\n');
    const end = paragraphs.slice(2 * third).join('\n\n');
    return { start, middle, end };
  };

  const handleSubmit = async () => {
    if (!userInput) return;

    setLoading(true);

    try {
      const response = await axios.post('https://backendgpt.enfection.com/api/chat', { message: userInput });
      const { story, summary, storyName } = response.data;

      setStory(story);
      setSummary(summary);
      setStoryName(storyName);

      console.log('Story and summary set:', { story, summary, storyName });

      // Generate images separately
      const { start, middle, end } = splitStoryIntoThreeParts(story);
      const startImageResponse = await axios.post('https://backendgpt.enfection.com/api/regenerate-image', { summary: start });
      const middleImageResponse = await axios.post('https://backendgpt.enfection.com/api/regenerate-image', { summary: middle });
      const endImageResponse = await axios.post('https://backendgpt.enfection.com/api/regenerate-image', { summary: end });

      setStartImageUrl(startImageResponse.data.newImageUrl);
      setMiddleImageUrl(middleImageResponse.data.newImageUrl);
      setEndImageUrl(endImageResponse.data.newImageUrl);

      console.log('Image URLs set:', { 
        startImageUrl: startImageResponse.data.newImageUrl, 
        middleImageUrl: middleImageResponse.data.newImageUrl, 
        endImageUrl: endImageResponse.data.newImageUrl 
      });

      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while generating the story and images. Please try again.');
      setStory('');
      setSummary('');
      setStartImageUrl(null);
      setMiddleImageUrl(null);
      setEndImageUrl(null);
      setStoryName('');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUserInput('');
    setStory('');
    setSummary('');
    setStartImageUrl(null);
    setMiddleImageUrl(null);
    setEndImageUrl(null);
    setStoryName('');
    setError('');
    setUploadedImageUrl('');
  };

  const handleDownloadPDF = async () => {
    if (!story || !storyName) return;

    try {
      const response = await axios.post(
        'https://backendgpt.enfection.com/api/pdf',
        { story, storyName },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'story.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('An error occurred while downloading the PDF. Please try again.');
    }
  };

  const handleRegenerateStory = async () => {
    try {
      const response = await axios.post('https://backendgpt.enfection.com/api/regenerate-story', { story, regeneratePrompt: userInput });
      setStory(response.data.newStory);
    } catch (error) {
      console.error('Error regenerating story:', error);
      setError('An error occurred while regenerating the story. Please try again.');
    }
  };

  const handleRegenerateImage = async () => {
    if (!summary) return;

    try {
      const response = await axios.post('https://backendgpt.enfection.com/api/regenerate-image', { summary });
      const { newImageUrl } = response.data;
      
      setStartImageUrl(newImageUrl);
      setMiddleImageUrl(newImageUrl);
      setEndImageUrl(newImageUrl);
    } catch (error) {
      console.error('Error regenerating image:', error);
      setError('An error occurred while regenerating the image. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setUploadedImageUrl(URL.createObjectURL(file));
  };

  const handleDescribeImage = async () => {
    if (!imageFile) {
      setError('Please select an image file.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await axios.post('https://backendgpt.enfection.com/api/describe-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImageDescription(response.data.description);
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while describing the image. Please try again.');
      setImageDescription('');
    } finally {
      setLoading(false);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setUploadedImageUrl('');
    setImageDescription('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="App">
      <h1>Story Generator</h1>
      <p>
        *The prompt should start like this: 
        <span className="highlight">"Tell me a story"</span>, 
        <span className="highlight">"Write a story"</span>, 
        or 
        <span className="highlight">"Create a story"</span>.
      </p>

      <div className="input-container">
        <textarea
          rows="1"
          cols="20"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Enter your story prompt here..."
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} spin /> // Spinner icon for loading state
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} />
          )}
          Generate Story
        </button>
        <button onClick={handleClear}>
          <FontAwesomeIcon icon={faTrash} /> Clear
        </button>
      </div>

      {story && (
        <div className="story-container">
          <h2>{storyName}</h2>
          <div className="story-content">
            {story.split('\n\n').map((paragraph, index) => {
              let imageUrl = '';
              const paragraphs = story.split('\n\n');
              const totalParagraphs = paragraphs.length;
              if (index === 0) imageUrl = startImageUrl;
              else if (index === Math.floor(totalParagraphs / 2)) imageUrl = middleImageUrl;
              else if (index === totalParagraphs - 1) imageUrl = endImageUrl;

              return (
                <div key={index} className="paragraph-container">
                  <p>{paragraph}</p>
                  {imageUrl && (
                    <div>
                      <img src={imageUrl} alt="Generated" className="paragraph-image" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={handleRegenerateStory} disabled={loading} className="regenerate-story-btn">
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin /> // Spinner icon for loading state
            ) : (
              <FontAwesomeIcon icon={faRedo} />
            )}
            Regenerate Story
          </button>
          <button onClick={handleRegenerateImage} disabled={loading || !summary} className="regenerate-image-btn">
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin /> // Spinner icon for loading state
            ) : (
              <FontAwesomeIcon icon={faRedo} />
            )}
            Regenerate Images
          </button>
          <button onClick={handleDownloadPDF} className="download-pdf-btn">
            <FontAwesomeIcon icon={faFilePdf} /> Download PDF
          </button>
        </div>
      )}

      <div className="input-container">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          ref={fileInputRef} 
          aria-label="Upload image for description"
        />
        <button onClick={handleDescribeImage} disabled={loading}>
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} spin /> // Spinner icon for loading state
          ) : (
            <FontAwesomeIcon icon={faEye} />
          )}
          Describe Image
        </button>
        <button onClick={handleClearImage} disabled={!imageFile} className="clear-image-btn">
          <FontAwesomeIcon icon={faTimes} /> Clear Image
        </button>
      </div>

      {uploadedImageUrl && (
        <div className="uploaded-image-container">
          <h3>Uploaded Image:</h3>
          <img src={uploadedImageUrl} alt="Uploaded" className="uploaded-image" />
        </div>
      )}

      {imageDescription && (
        <div className="description-container">
          <p className="description-label">Generated Description:</p>
          {imageDescription.split('\n\n').map((paragraph, index) => (
            <p key={index} className="description-text">{paragraph}</p>
          ))}
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default App;
