import { useState, useEffect, useRef} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/MessageCreation.css';
import { addMessage } from '../services/messageService';
import { getAllSpecies } from '../services/speciesService';
import { getAllTriggerTypes } from '../services/triggerTypeService';
import { Species } from '../types/species';

const MessageCreation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables for inputs
  const [messageTitle, setMessageTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [severity, setSeverity] = useState(1);

  const [triggerTypes, setTriggerTypes] = useState<string[]>([]);
  const [selectedTriggerID, setSelectedTriggerID] = useState<string>('encounter'); // Default trigger ID
  const [selectedTriggerName, setSelectedTriggerName] = useState<string>('Encounter'); // Default trigger name
  const [isTriggerDropdownOpen, setIsTriggerDropdownOpen] = useState<boolean>(false);

  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpeciesID, setSelectedSpeciesID] = useState('');
  const [selectedSpeciesName, setSelectedSpeciesName] = useState('Select Species');
  const [isSpeciesDropdownOpen, setIsSpeciesDropdownOpen] = useState(false);

  const [encounterMeters, setEncounterMeters] = useState('');
  const [encounterMinutes, setEncounterMinutes] = useState('');

  const messageTitleRef = useRef<HTMLInputElement>(null);
  const messageTextRef = useRef<HTMLInputElement>(null);
  const encounterMetersRef = useRef<HTMLInputElement>(null);
  const encounterMinutesRef = useRef<HTMLInputElement>(null);
  const speciesDropdownRef = useRef<HTMLButtonElement>(null);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Fetch trigger types when component mounts
  useEffect(() => {
    const fetchTriggerTypes = async () => {
      try {
        const triggers = await getAllTriggerTypes();
        const filteredTriggers = triggers.filter((trigger) => trigger.toLowerCase() !== 'answer'); //Temporary Solution
        setTriggerTypes(filteredTriggers);
      } catch (error) {
        console.error('Error fetching trigger types:', error);
        // Optionally, handle the error (e.g., show a notification)
      }
    };
    fetchTriggerTypes();
  }, []);


  // Species list
    // Fetch species list when component mounts
    useEffect(() => {
      const fetchSpecies = async () => {
        try {
          const species = await getAllSpecies();
          setSpeciesList(species);
        } catch (error) {
          console.error('Error fetching species:', error);
        }
      };
      fetchSpecies();
    }, []);

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset custom validity messages
    messageTitleRef.current?.setCustomValidity('');
    messageTextRef.current?.setCustomValidity('');
    encounterMetersRef.current?.setCustomValidity('');
    encounterMinutesRef.current?.setCustomValidity('');

    // Validate Message Title
    if (messageTitle.trim() === '') {
      messageTitleRef.current?.setCustomValidity('Message title is required.');
      isValid = false;
    }

    // Validate Message Text
    if (messageText.trim() === '') {
      messageTextRef.current?.setCustomValidity('Message text is required.');
      isValid = false;
    }

    if (selectedSpeciesID === '') {
      speciesDropdownRef.current?.setCustomValidity('Please select a species.');
      isValid = false;
    }
    
    // Validate Encounter Fields if Trigger is 'encounter'
    if (selectedTriggerID === 'encounter') {
      const meters = Number(encounterMeters);
      const minutes = Number(encounterMinutes);

      if (isNaN(meters) || meters < 1) {
        encounterMetersRef.current?.setCustomValidity('Meters must be at least 1.');
        isValid = false;
      }

      if (isNaN(minutes) || minutes < 1) {
        encounterMinutesRef.current?.setCustomValidity('Minutes must be at least 1.');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    // Validate inputs
    e.preventDefault();

    const isValid = validateForm();

    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!isValid) {
      return;
    }

    const messageData: any = {
      name: messageTitle,
      text: messageText,
      severity: severity,
      trigger: selectedTriggerID,
      speciesID: selectedSpeciesID,
      experimentID: id,
    };

    // Adjust fields based on trigger type
    if (selectedTriggerID === 'encounter') {
      // Convert encounterMeters and encounterMinutes to numbers
      const meters = Number(encounterMeters);
      const minutes = Number(encounterMinutes);
      messageData.encounterMeters = meters;
      messageData.encounterMinutes = minutes;
    }

    try {
      // Call the addMessage API
      const response = await addMessage(messageData);
      console.log('Message added successfully:', response);
      // Redirect to the message dashboard
      navigate(`/messagedashboard/${id}`);
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Failed to add message. Please check your input and try again.');
    }
  };

  return (
    <div className="message-creation-container">
      {/* Navbar */}
      <Navbar />
  
      {/* Main Container */}
      <div className="message-creation-main-container">
        {/* Title */}
        <h1 className="message-creation-page-title">New Message</h1>
        {/* Content Box */}
        <form
          className="message-creation-content-box"
          onSubmit={handleSubmitMessage}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          noValidate
        >
          {/* Message Title */}
          <label className="message-creation-section-label message-creation-title-label">
            Message Title *
          </label>
          <input
            type="text"
            className="message-creation-text-input message-creation-title-input"
            placeholder="Enter message title..."
            value={messageTitle}
            onChange={(e) => setMessageTitle(e.target.value)}
            required
            ref={messageTitleRef}
          />
  
          {/* Message Text */}
          <label className="message-creation-section-label message-creation-text-label">
            Message Text * 
          </label>
          <input
            type="text"
            className="message-creation-text-input message-creation-text-input"
            placeholder="Enter message text..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            required
            ref={messageTextRef}
          />

          {/* Severity, Trigger, Species, and Conditional Fields */}
          <div className="message-creation-flex-container">
            {/* Severity */}
            <div className="message-creation-severity-section">
              <label className="message-creation-section-number">1. Severity *</label>
              <div className="message-creation-slider-input">
                <input
                  type="range"
                  id="severity"
                  min="1"
                  max="5"
                  step="1"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                />
                <span>{severity}</span>
              </div>
            </div>

            {/* Specify Trigger */}
            <div className="message-creation-trigger-section">
              <label className="message-creation-section-number">2. Specify Trigger *</label>
              <div className="message-creation-trigger-content">
                <div
                  className={`message-creation-dropdown ${
                    isTriggerDropdownOpen ? 'message-creation-open' : ''
                  }`}
                >
                  <button
                    className="message-creation-dropdown-button"
                    onClick={() => setIsTriggerDropdownOpen(!isTriggerDropdownOpen)}
                  >
                    {selectedTriggerName}
                    <img
                      src="/assets/vsvg.svg"
                      alt="Dropdown Icon"
                      className="message-creation-dropdown-icon"
                    />
                  </button>
                  {isTriggerDropdownOpen && (
                    <div className="message-creation-dropdown-content">
                      {triggerTypes.map((trigger) => (
                        <div
                          key={trigger}
                          className="message-creation-dropdown-item"
                          onClick={() => {
                            setSelectedTriggerID(trigger);
                            setSelectedTriggerName(capitalize(trigger));
                            setIsTriggerDropdownOpen(false);
                            // Reset conditional fields
                            setEncounterMeters('');
                            setEncounterMinutes('');
                          }}
                        >
                          {capitalize(trigger)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specify Species */}
            <div className="message-creation-species-section">
              <label className="message-creation-section-number">3. Species *</label>
              <div className="message-creation-species-content">
                <div
                  className={`message-creation-dropdown ${
                    isSpeciesDropdownOpen ? 'message-creation-open' : ''
                  }`}
                >
                  <button
                    className="message-creation-dropdown-button"
                    onClick={() => setIsSpeciesDropdownOpen(!isSpeciesDropdownOpen)}
                    ref={speciesDropdownRef}
                  >
                    {selectedSpeciesName}
                    <img
                      src="/assets/vsvg.svg"
                      alt="Dropdown Icon"
                      className="message-creation-dropdown-icon"
                    />
                  </button>
                  {isSpeciesDropdownOpen && (
                    <div className="message-creation-dropdown-content">
                      {speciesList.map((species) => (
                        <div
                          key={species.ID}
                          className="message-creation-dropdown-item"
                          onClick={() => {
                            setSelectedSpeciesID(species.ID);
                            setSelectedSpeciesName(`${species.commonName} (${species.name})`);
                            setIsSpeciesDropdownOpen(false);
                            speciesDropdownRef.current?.setCustomValidity('');
                          }}
                        >
                          {species.commonName} ({species.name})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conditional Fields Based on Trigger */}
            {selectedTriggerID === 'encounter' && (
              <>
                {/* Encounter Meters */}
                <div className="message-creation-encounter-meters-section">
                  <label className="message-creation-section-number">
                    4. Encounter Meters *
                  </label>
                  <input
                    type="number"
                    className="message-creation-number-input"
                    placeholder="Enter meters..."
                    value={encounterMeters}
                    onChange={(e) => setEncounterMeters(e.target.value)}
                    min="1"
                    required
                    ref={encounterMetersRef}
                  />
                </div>

                {/* Encounter Minutes */}
                <div className="message-creation-encounter-minutes-section">
                  <label className="message-creation-section-number">
                    5. Encounter Minutes *
                  </label>
                  <input
                    type="number"
                    className="message-creation-number-input"
                    placeholder="Enter minutes..."
                    value={encounterMinutes}
                    onChange={(e) => setEncounterMinutes(e.target.value)}
                    min="1"
                    required
                    ref={encounterMinutesRef}
                  />
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <button
              type="submit"
              className="message-creation-submit-button"
              data-testid="submit-message-button"
            >
              <img src="/assets/saveSVG.svg" alt="Submit Message" />
          </button>
        </form>
       </div>
      </div>
  );
}


export default MessageCreation;
