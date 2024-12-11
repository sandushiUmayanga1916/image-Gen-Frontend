/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faTrash,
  faRedo,
  faFilePdf,
  faTimes,
  faEye,
  faSpinner,
  faBook,
  faUpload,
  faExclamationTriangle,
  faSync,
  faDownload,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import "./App.css";

const App = () => {
  const [userInput, setUserInput] = useState("");
  const [story, setStory] = useState("");
  const [summary, setSummary] = useState("");
  const [startImageUrl, setStartImageUrl] = useState(null);
  const [middleImageUrl, setMiddleImageUrl] = useState(null);
  const [endImageUrl, setEndImageUrl] = useState(null);
  const [storyName, setStoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageDescription, setImageDescription] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [storyData, setStoryData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [numChapters, setNumChapters] = useState(1);
  const [maxWordsPerChapter, setMaxWordsPerChapter] = useState(500);
  const [imageUrls, setImageUrls] = useState([]);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [isImageGeneratedStory, setIsImageGeneratedStory] = useState(false);
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [flipbookUrl, setFlipbookUrl] = useState("");
  const [isCreatingFlipbook, setIsCreatingFlipbook] = useState(false);
  const [flipbookError, setFlipbookError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);


  const MAX_RETRIES = 5;
const RETRY_DELAY = 10000; // 10 seconds

const handleGeneratePreview = async () => {
  setIsGenerating(true);
  setError(null);

  try {
    const response = await axios.post('http://backend-gpt.enfection.com/api/generate-pdf-preview', {
      storyData,
      imageUrls,
      storyName,
    });

    const { previewUrl } = response.data;
    setPreviewUrl(previewUrl);
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    setError('Failed to generate PDF preview. Please try again.');
  } finally {
    setIsGenerating(false);
  }
};

const handleDownload = () => {
  if (previewUrl) {
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${storyName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (!userInput) return;

    setLoading(true);
    setIsImageGeneratedStory(false);

    try {
      const response = await axios.post("http://backend-gpt.enfection.com/api/chat", {
        message: userInput,
        numChapters,
        maxWordsPerChapter,
      });
      const { summary, imageUrls, storyName, ...chaptersData } = response.data;

      setStoryData(chaptersData);
      setSummary(summary);
      setImageUrls(imageUrls || []);
      setStoryName(storyName);

      setError("");
    } catch (error) {
      console.error("Detailed error:", error);
      setError(
        `An error occurred: ${error.message}. ${
          error.response ? JSON.stringify(error.response.data) : ""
        }`
      );
      setStoryData(null);
      setSummary("");
      setImageUrls([]);
      setStoryName("");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    // Clear input fields
    setUserInput("");
    setNumChapters(1); // Reset to default or initial value
    setMaxWordsPerChapter(100); // Reset to default or initial value

    // Clear story data and related states
    setStoryData({});
    setStoryName("");
    setSummary("");
    setStartImageUrl(null);
    setMiddleImageUrl(null);
    setEndImageUrl(null);
    setIsImageGeneratedStory(false);

    // Clear any errors or uploaded image URLs
    setError("");
    setUploadedImageUrl("");

    // Optional: If you want to reset loading state
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (!storyData || !storyName) return;

    try {
      const response = await axios.post(
        "http://backend-gpt.enfection.com/api/pdf",
        {
          storyData,
          imageUrls,
          storyName,
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "story.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setError(
        "An error occurred while downloading the PDF. Please try again."
      );
    }
  };

  const handleRegenerateStory = async () => {
    try {
      const response = await axios.post(
        "http://backend-gpt.enfection.com/api/regenerate-story",
        { story, regeneratePrompt: userInput }
      );
      setStory(response.data.newStory);
    } catch (error) {
      console.error("Error regenerating story:", error);
      setError(
        "An error occurred while regenerating the story. Please try again."
      );
    }
  };

  const handleRegenerateImage = async () => {
    if (!summary) return;

    try {
      const response = await axios.post(
        "http://backend-gpt.enfection.com/api/regenerate-image",
        { summary }
      );
      const { newImageUrl } = response.data;
      setStartImageUrl(newImageUrl);
      setMiddleImageUrl(newImageUrl);
      setEndImageUrl(newImageUrl);
    } catch (error) {
      console.error("Error regenerating image:", error);
      setError(
        "An error occurred while regenerating the image. Please try again."
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setUploadedImageUrl(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    setImageFile(null);
    setUploadedImageUrl("");
    setImageDescription("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateStoryFromImage = async () => {
    if (!imageFile) {
      setError("Please select an image file.");
      return;
    }

    setGeneratingStory(true);
    setIsImageGeneratedStory(true);

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("numChapters", numChapters);
    formData.append("maxWordsPerChapter", maxWordsPerChapter);

    try {
      const response = await axios.post(
        "http://backend-gpt.enfection.com/api/generate-story-from-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { summary, imageUrls, storyName, ...chaptersData } = response.data;

      setStoryData(chaptersData);
      setSummary(summary);
      setImageUrls(imageUrls || []);
      setStoryName(storyName);
      setError("");

      setImageDescription(summary);
    } catch (error) {
      console.error("Error:", error);
      setError("Error generating story from image");
      setImageDescription("");
    } finally {
      setGeneratingStory(false);
    }
  };

  const createFlipbook = async (pdfFile) => {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
  
    try {
      const response = await axios.post('http://backend-gpt.enfection.com/api/create-flipbook-from-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (response.data && response.data.flipbookId) {
        return await pollFlipbookStatus(response.data.flipbookId);
      } else {
        throw new Error('Flipbook ID not found in response');
      }
    } catch (error) {
      console.error('Error creating flipbook:', error);
      throw error;
    }
  };
  
  const pollFlipbookStatus = async (flipbookId) => {
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const statusResponse = await axios.get(`http://backend-gpt.enfection.com/api/check-flipbook-status/${flipbookId}`);
        
        if (statusResponse.data.status === 'Ready') {
          return statusResponse.data.details.publication.canonicalLink;
        } else if (statusResponse.data.status === 'Error') {
          throw new Error('Flipbook creation failed');
        }
        
        // If not ready, wait before next retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } catch (error) {
        console.error('Error checking flipbook status:', error);
        if (i === MAX_RETRIES - 1) throw error;
      }
    }
    throw new Error('Flipbook creation timed out');
  };
  
  const handlePdfFileChange = (e) => {
    setPdfFile(e.target.files[0]);
    setFlipbookError('');
    setRetryCount(0);
  };

const handleCreateFlipbook = async () => {
    if (!previewUrl) {
      setFlipbookError('Preview URL is not available.');
      return;
    }

    setIsCreatingFlipbook(true);
    setFlipbookError('');

    try {
      const response = await axios.post('http://backend-gpt.enfection.com/api/create-flipbook-from-url', { previewUrl });

      if (response.data && response.data.flipbookUrl) {
        setFlipbookUrl(response.data.flipbookUrl);
        setFlipbookError('');
      } else {
        throw new Error('Flipbook URL not found in response');
      }
    } catch (error) {
      console.error('Error in flipbook creation process:', error);
      setFlipbookError(error.message || 'An error occurred while creating the flipbook.');
    } finally {
      setIsCreatingFlipbook(false);
    }
  };

  const handleRetryCreateFlipbook = () => {
    setRetryCount((prevCount) => prevCount + 1);
    handleCreateFlipbook();
  };

  const handleViewFlipbook = () => {
    window.open(flipbookUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGeneratePDF = async () => {
    if (!storyData || !storyName) return;
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://backend-gpt.enfection.com/api/generate-pdf",
        {
          storyData,
          imageUrls,
          storyName,
        },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "story.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("An error occurred while generating the PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Story Generator</h1>
      <p>
        *The prompt should start like this:
        <span className="highlight">"Tell me a story"</span>,
        <span className="highlight">"Write a story"</span>, or
        <span className="highlight">"Create a story"</span>.
      </p>

      <div className="input-container">
        <textarea
          value={userInput}
          onChange={handleInputChange}
          placeholder="Enter your story prompt here..."
        />
        <input
          type="number"
          value={numChapters}
          onChange={(e) => setNumChapters(parseInt(e.target.value))}
          min="1"
          max="10"
          placeholder="Number of chapters"
        />
        <input
          type="number"
          value={maxWordsPerChapter}
          onChange={(e) => setMaxWordsPerChapter(parseInt(e.target.value))}
          min="100"
          max="1000"
          step="100"
          placeholder="Max words per chapter"
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} />
          )}
          Generate Story
        </button>
        <button onClick={handleClear}>
          <FontAwesomeIcon icon={faTrash} /> Clear
        </button>
      </div>

      {!isImageGeneratedStory && storyData && (
        <div className="story-container">
          <h2>{storyName}</h2>
          <div className="story-content">
            {Object.entries(storyData).map(([key, value], index) => {
              if (key.endsWith("Name")) return null;
              const chapterNumber = key.replace("chapter", "");
              const chapterName = storyData[`chapter${chapterNumber}Name`];
              const imageUrl = imageUrls[index];

              return (
                <div key={key} className="chapter-container">
                  <h3>
                    Chapter {chapterNumber}: {chapterName}
                  </h3>
                  {value.split("\n\n").map((paragraph, pIndex) => (
                    <p key={pIndex}>{paragraph}</p>
                  ))}
                  {imageUrl && (
                    <div>
                      <img
                        src={imageUrl}
                        alt={`Chapter ${chapterNumber}`}
                        className="chapter-image"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={handleRegenerateStory}
            disabled={loading}
            className="regenerate-story-btn"
          >
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faRedo} />
            )}
            Regenerate Story
          </button>
          <button
            onClick={handleRegenerateImage}
            disabled={loading || !summary}
            className="regenerate-image-btn"
          >
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
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

      <div className="input-area-container">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          aria-label="Upload image for story generation"
        />
        <button
          onClick={handleGenerateStoryFromImage}
          disabled={generatingStory || !imageFile}
        >
          {generatingStory ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faEye} />
          )}
          Generate Story from Image
        </button>
        <button
          onClick={handleClearImage}
          disabled={!imageFile}
          className="clear-image-btn"
        >
          <FontAwesomeIcon icon={faTimes} /> Clear Image
        </button>
      </div>

      {uploadedImageUrl && (
        <div className="uploaded-image-container">
          <h3>Uploaded Image:</h3>
          <img
            src={uploadedImageUrl}
            alt="Uploaded"
            className="uploaded-image"
          />
        </div>
      )}

      {isImageGeneratedStory && imageDescription && (
        <div className="image-story-container">
          <h2>{storyName || "Generated Story from Image"}</h2>
          <div className="story-generate-content">
            {Object.entries(storyData || {}).map(([key, value], index) => {
              if (key.endsWith("Name")) return null;
              const chapterNumber = key.replace("chapter", "");
              const chapterName = storyData[`chapter${chapterNumber}Name`];
              const imageUrl = imageUrls[index];

              return (
                <div key={key} className="image-chapter-container">
                  <h3>
                    Chapter {chapterNumber}: {chapterName}
                  </h3>
                  {value.split("\n\n").map((paragraph, pIndex) => (
                    <p key={pIndex} className="chapter-text">
                      {paragraph}
                    </p>
                  ))}
                  {imageUrl && (
                    <div className="chapter-image-container">
                      <img
                        src={imageUrl}
                        alt={`Chapter ${chapterNumber}`}
                        className="chapter-image"
                      />
                    </div>
                  )}
                </div>
              );
            })}
<div className="flipbook-creator">
      <button
        onClick={handleCreateFlipbook}
        disabled={isCreatingFlipbook || !previewUrl}
      >
        {isCreatingFlipbook ? (
          <>
            <FontAwesomeIcon icon={faSpinner} spin /> Creating Flipbook...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faBook} /> Create Flipbook
          </>
        )}
      </button>

      {flipbookUrl && !flipbookError && (
        <div className="flipbook-link-container">
          <p>Flipbook created successfully!</p>
          <button onClick={handleViewFlipbook}>
            <FontAwesomeIcon icon={faEye} /> View Flipbook
          </button>
        </div>
      )}

      {flipbookError && (
        <div className="flipbook-error-container">
          <p className="error-message">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {flipbookError}
          </p>
          {retryCount < 3 && (
            <button onClick={handleRetryCreateFlipbook}>
              <FontAwesomeIcon icon={faSync} /> Retry Creating Flipbook
            </button>
          )}
          {retryCount >= 3 && (
            <p>
              Maximum retry attempts reached. Please try again later or
              contact support.
            </p>
          )}
        </div>
      )}
    </div>
            <button
              onClick={handleGeneratePDF}
              className="download-pdf-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Generating PDF...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faFilePdf} /> Generate & Download PDF
                </>
              )}
            </button>
            <div className="pdf-preview-container">
        <button onClick={handleGeneratePreview} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin /> Generating Preview...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faEye} /> Preview PDF
            </>
          )}
        </button>
        
        {previewUrl && (
          <div className="preview-actions">
            <iframe src={previewUrl} width="100%" height="500px" title="PDF Preview" />
            <button onClick={handleDownload}>
              <FontAwesomeIcon icon={faDownload} /> Download PDF
            </button>
            <div className="preview-url">
              <FontAwesomeIcon icon={faLink} /> Preview URL: 
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">{previewUrl}</a>
            </div>
          </div>
        )}
        
        {error && <p className="error-message">{error}</p>}
      </div>
          </div>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default App;
