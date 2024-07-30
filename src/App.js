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
  faDownload,
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
  const [creatingFlipbook, setCreatingFlipbook] = useState(false);
  const [flipbookUrl, setFlipbookUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (!userInput) return;

    setLoading(true);
    setIsImageGeneratedStory(false);

    try {
      const response = await axios.post("http://localhost:4000/api/chat", {
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
    setUserInput("");
    setStory("");
    setSummary("");
    setStartImageUrl(null);
    setMiddleImageUrl(null);
    setEndImageUrl(null);
    setStoryName("");
    setError("");
    setUploadedImageUrl("");
    setIsImageGeneratedStory(false);
  };

  const handleDownloadPDF = async () => {
    if (!storyData || !storyName) return;

    try {
      const response = await axios.post(
        "http://localhost:4000/api/pdf",
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
        "http://localhost:4000/api/regenerate-story",
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
        "http://localhost:4000/api/regenerate-image",
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
        "http://localhost:4000/api/generate-story-from-image",
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
  const handleCreateFlipbook = async () => {
    if (!storyData) return;

    setCreatingFlipbook(true);
    try {
      const response = await axios.post(
        "http://localhost:4000/api/create-flipbook",
        {
          storyData,
          imageUrls,
          storyName,
        }
      );

      setFlipbookUrl(response.data.flipbookUrl);
      setDownloadUrl(response.data.downloadUrl);
    } catch (error) {
      console.error("Error creating flipbook:", error);
      // Handle error (e.g., show an error message to the user)
    } finally {
      setCreatingFlipbook(false);
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
          </div>
          <button
            onClick={handleCreateFlipbook}
            disabled={creatingFlipbook}
            className="create-flipbook-btn"
          >
            {creatingFlipbook ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faBook} />
            )}
            Create Flipbook
          </button>

          {flipbookUrl && (
            <a
              href={flipbookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="preview-flipbook-btn"
            >
              <FontAwesomeIcon icon={faEye} /> Preview Flipbook
            </a>
          )}

          {downloadUrl && (
            <a href={downloadUrl} download className="download-flipbook-btn">
              <FontAwesomeIcon icon={faDownload} /> Download Flipbook
            </a>
          )}
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default App;
