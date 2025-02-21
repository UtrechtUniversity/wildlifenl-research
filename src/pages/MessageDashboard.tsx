import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/MessageDashboard.css';
import { getMessagesByExperimentID } from '../services/messageService';
import { Message } from '../types/message';
import { Experiment } from '../types/experiment';
import { User } from '../types/user'; // Import User

interface TriggerType {
  ID: string;
  name: string;
}

const MessageDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  

  const severityLabels: { [key: number]: string } = {
    1: 'debug',
    2: 'info',
    3: 'warning',
    4: 'urgent',
    5: 'critical',
  };

  const [interactionTypes, setInteractionTypes] = useState<TriggerType[]>([]);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const location = useLocation();
  const experiment = location.state?.experiment as Experiment | null;
  const loggedInUser: User | undefined = location.state?.user; // Add loggedInUser
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedTriggerType, setSelectedInteractionType] = useState<string>('All');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Message; direction: string } | null>(null);
  const [showEncounterMeters, setShowEncounterMeters] = useState<boolean>(false);
  const [showEncounterMinutes, setShowEncounterMinutes] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSpeciesDropdownOpen, setIsSpeciesDropdownOpen] = useState(false);

  const isCreator = loggedInUser?.ID === experiment?.user.ID; // Define isCreator

  // Define status based on experiment dates
  const getStatus = (startDate: string, endDate?: string | null): string => {
    const today = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    if (start > today) {
      return 'Upcoming';
    } else if (end && end < today) {
      return 'Completed';
    } else {
      return 'Live';
    }
  };

  const status = experiment
    ? getStatus(experiment.start, experiment.end)
    : 'Unknown';

  // Fetch messages and extract unique species and triggers
  useEffect(() => {
    const fetchMessages = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const fetchedMessages = await getMessagesByExperimentID(id);
        setMessages(fetchedMessages);

        // Extract unique species' common names
        const speciesSet = new Set<string>();
        const interactionTypesSet = new Set<string>();

        fetchedMessages.forEach((msg: Message) => {
          if (msg.species && msg.species.commonName) {
            const speciesName = `${msg.species.commonName} (${msg.species.name})`;
          speciesSet.add(speciesName);
          }
          if (msg.trigger) {
            interactionTypesSet.add(msg.trigger);
          }
        });

        setSpeciesList(['All', ...Array.from(speciesSet)]);

        const allTriggerTypesOption: TriggerType = {
          ID: 'all',
          name: 'All',
        };
        const interactionTypesData = Array.from(interactionTypesSet).map((type) => ({
          ID: type,
          name: type,
        }));
        setInteractionTypes([allTriggerTypesOption, ...interactionTypesData]);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [id]);

  useEffect(() => {
    setShowEncounterMeters(
      filteredMessages.some(
        (msg) => msg.encounterMeters != null && msg.encounterMeters > 0
      )
    );

    setShowEncounterMinutes(
      filteredMessages.some(
        (msg) => msg.encounterMinutes != null && msg.encounterMinutes > 0
      )
    );
  }, [filteredMessages]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    let filtered = [...messages];

    // Filter by Species
    if (selectedSpecies !== 'All') {
      filtered = filtered.filter((msg: Message) => {
        const speciesName = msg.species
          ? `${msg.species.commonName} (${msg.species.name})`
          : '';
        return speciesName === selectedSpecies;
      });
    }

    // Filter by TriggerType
    if (selectedTriggerType !== 'All') {
      filtered = filtered.filter((msg: Message) => msg.trigger === selectedTriggerType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((msg: Message) =>
        msg.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a: Message, b: Message) => {
        let aValue: any = a[sortConfig.key] || '';
        let bValue: any = b[sortConfig.key] || '';

        if (sortConfig.key === 'species') {
          aValue = a.species?.commonName.toLowerCase() || '';
          bValue = b.species?.commonName.toLowerCase() || '';
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredMessages(filtered);
  }, [selectedSpecies, selectedTriggerType, searchQuery, sortConfig, messages]);

  // Handle sorting
  const requestSort = (key: keyof Message) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Function to get sort icon class
  const getSortIconClass = (columnKey: keyof Message) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'ascending' ? 'sort-ascending' : 'sort-descending';
    }
    return '';
  };

  // Handle navigation to create message page
  const navigateToCreateMessage = () => {
    navigate(`/messagecreation/${id}`);
  };

  // Handle navigation to message details page
  const handleMessageClick = (message: Message) => {
    navigate(`/message/${id}`, { state: { message, user: loggedInUser } });
  };

  // Function to truncate text to a specified length
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="message-dashboard-container" data-testid="message-dashboard-container">
      {/* Navbar */}
      <Navbar />

      {/* Messages Title */}
      <h1 className="messages-title" data-testid="messages-title">
        Messages for Experiment: {truncateText(experiment?.name || `Experiment ${id}`, 23)}
      </h1>

      {/* Filters Container */}
      <div className="message-filters-container" data-testid="filters-container">
        {/* Species Filter */}
        <div className="message-filter species-filter" data-testid="species-filter">
          <label className="filter-label">Filter by species:</label>
          <div className={`dropdown ${isSpeciesDropdownOpen ? 'open' : ''}`}>
            <button
              className="dropdown-button"
              data-testid="species-dropdown-button"
              onClick={() => setIsSpeciesDropdownOpen(!isSpeciesDropdownOpen)}
            >
              {selectedSpecies}
              <img
                src="/assets/vsvg.svg"
                alt="Dropdown Icon"
                className={`dropdown-icon ${isSpeciesDropdownOpen ? 'dropdown-icon-hover' : ''}`}
              />
            </button>
            {isSpeciesDropdownOpen && (
              <div className="dropdown-content" data-testid="species-dropdown-content">
                {speciesList.map((speciesName) => (
                  <div
                    key={speciesName}
                    data-testid={`species-option-${speciesName}`}
                    className="dropdown-item"
                    onClick={() => {
                      setSelectedSpecies(speciesName);
                      setIsSpeciesDropdownOpen(false);
                    }}
                  >
                    {speciesName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TriggerType Filter */}
        <div className="message-filter interactiontype-filter" data-testid="interactiontype-filter">
          <label className="filter-label">Filter by trigger:</label>
          <div className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
            <button
              className="dropdown-button"
              data-testid="interactiontype-dropdown-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {selectedTriggerType}
              <img
                src="/assets/vsvg.svg"
                alt="Dropdown Icon"
                className={`dropdown-icon ${isDropdownOpen ? 'dropdown-icon-hover' : ''}`}
              />
            </button>
            {isDropdownOpen && (
              <div className="dropdown-content" data-testid="interactiontype-dropdown-content">
                {interactionTypes.map((type) => (
                  <div
                    key={type.ID}
                    data-testid={`interactiontype-option-${type.ID}`}
                    className="dropdown-item"
                    onClick={() => {
                      setSelectedInteractionType(type.name);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {type.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Filter */}
        <div className="message-filter search-filter" data-testid="search-filter">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
            <img src="/assets/SearchSVG.svg" alt="Search Icon" className="search-icon" />
          </div>
        </div>
      </div>

      {/* Loading Animation or Messages Table */}
      {isLoading ? (
        <div className="loading-container" data-testid="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Messages Table */}
          <div className="message-table-container" data-testid="table-container">
            <table
              className="messages-table"
              data-testid="messages-table"
            >
              <thead>
                <tr>
                  <th onClick={() => requestSort('name')}>
                    Name
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('name')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('species')}>
                    Species
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('species')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('trigger')}>
                    Trigger
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('trigger')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('text')}>
                    Text
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('text')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('severity')}>
                    Severity
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('severity')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('activity')}>
                    Activity
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('activity')}`}
                    />
                  </th>
                  {showEncounterMeters && (
                    <th onClick={() => requestSort('encounterMeters')}>
                      Encounter Meters
                      <img
                        src="/assets/vblacksvg.svg"
                        alt="Sort Icon"
                        className={`sort-icon ${getSortIconClass('encounterMeters')}`}
                      />
                    </th>
                  )}
                  {showEncounterMinutes && (
                    <th onClick={() => requestSort('encounterMinutes')}>
                      Encounter Minutes
                      <img
                        src="/assets/vblacksvg.svg"
                        alt="Sort Icon"
                        className={`sort-icon ${getSortIconClass('encounterMinutes')}`}
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg: Message, index: number) => {
                  return (
                    <tr
                      key={msg.ID}
                      data-testid={`message-row-${msg.ID}`}
                      className={index % 2 === 0 ? 'row-even' : 'row-odd'}
                      style={{ cursor: 'pointer' }}
                    >
                      <td
                        data-testid="message-name"
                        onClick={() => handleMessageClick(msg)}
                      >
                        {truncateText(msg.name, 20)}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.species
                          ? `${msg.species.commonName} (${msg.species.name})`
                          : 'No Species'}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.trigger}
                      </td>
                      
                      <td onClick={() => handleMessageClick(msg)}>
                        {truncateText(msg.text, 12)}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {severityLabels[msg.severity] || 'Unknown'}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.activity.toString()}
                      </td>
                      {showEncounterMeters && (
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.encounterMeters}
                      </td>
                    )}
                    {showEncounterMinutes && (
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.encounterMinutes}
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Message Button */}
          <button
            className="add-message-button"
            onClick={isCreator && status === 'Upcoming' ? navigateToCreateMessage : undefined}
            disabled={!isCreator || status !== 'Upcoming'}
            title={
              !isCreator
                ? 'Messages can only be created by the owner of the experiment before it goes live'
                : status !== 'Upcoming'
                ? 'Messages can only be created before the experiment goes live'
                : 'Create new message'
            }
            data-testid="add-message-button"
          >
            <img
              src={
                isCreator && status === 'Upcoming'
                  ? "/assets/AddButtonSVG.svg"
                  : "/assets/GrayAddButtonSVG.svg"
              }
              alt="Add Message"
            />
          </button>
        </>
      )}
    </div>
  );
};

export default MessageDashboard;
