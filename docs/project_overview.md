# Project Overview: Blackfoot - Play and Learn

## Abstract

Blackfoot (Niitsíʼpowahsin) is a culturally and historically significant Indigenous language of the Blackfoot Confederacy and a primary medium through which community knowledge, identity, and oral traditions are sustained. As with many Indigenous languages, Blackfoot is experiencing ongoing endangerment, highlighting the need for accessible learning tools and culturally grounded resources that support intergenerational transmission and revitalization.

## Project Objectives

The Blackfoot - Play and Learn project aims to create a web-based, game-driven language-learning application that integrates cultural context with structured, practice-oriented activities. The goal is to provide an engaging platform for learning Blackfoot through stories, practice, and games, supporting focused, daily progress in language acquisition while honoring cultural heritage.

## Functional Requirements

- Provide multiple language learning activities including:
  - Blackfoot History section to explore cultural stories and traditions.
  - Flashcards for incremental vocabulary acquisition.
  - Blackfoot Builder for scaffolded construction of meaning through guided word selection.
  - Voices of the Blackfoot for listening-centered engagement with narrative content and dialect identification.
  - Quiz module for rapid recall and self-assessment.
- Persistent leaderboard to encourage engagement and track progress.
- User authentication and score tracking.
- Audio playback support using Firebase Storage and speech synthesis fallback.
- Theme-based content loading with session persistence.
- Navigation between modules with client-side routing.

## Non-Functional Requirements

- Responsive and accessible UI using React and Tailwind CSS.
- Real-time data fetching and updates via Firebase Firestore and Storage.
- Robust error handling and user feedback.
- Session persistence for user progress.
- Modular, reusable UI components for maintainability.

## Design Considerations

- Modular React component architecture to support reusability and scalability.
- Integration of cultural context and historical content to enrich learning.
- Dialect awareness incorporated throughout the system to reflect the diversity of Blackfoot language varieties.
- Use of Firebase backend services to simplify data management and authentication.
- Clear separation of UI and business logic.
- Accessibility and user experience prioritized with clear feedback and navigation.

## Software Development Lifecycle

- Iterative development with incremental feature additions.
- Bootstrapped with Create React App for streamlined React environment setup.
- Testing and build scripts included for quality assurance.
- Production-ready builds optimized for performance and deployment.

## Software Architecture

- Frontend built with React functional components and hooks.
- Backend services provided by Firebase Firestore (data) and Storage (audio).
- Client-server communication via Firebase SDK.
- State management using React useState and useEffect hooks.
- Routing handled by react-router-dom for seamless navigation.
- Audio playback supports both stored audio files and speech synthesis.
- Session state persisted in browser sessionStorage scoped by theme.

## Dialect Awareness

Recognizing that Blackfoot is spoken across multiple dialects, the application incorporates dialect awareness throughout its modules. This includes displaying dialect information where relevant (e.g., in the Blackfoot Builder game) and supporting dialect-specific content to ensure cultural and linguistic accuracy.

## Future Work

Future development will focus on expanding and refining learning content in collaboration with community partners to improve instructional effectiveness and strengthen cultural alignment.
