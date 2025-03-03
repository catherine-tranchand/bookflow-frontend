import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet } from 'react-native';

const AboutTitleAnimation = () => {
  const aboutTitles = [
    "Welcome",
    "Добро пожаловать"
  ];

  const [currentTitle, setCurrentTitle] = useState('');
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  const titlesTimerRef = useRef(null);
  const titleTimerRef = useRef(null);

  useEffect(() => {
    startAboutTitlesAnimation(3000); // Duration for each title (3 seconds)
    return () => {
      stopAboutTitlesAnimation();
    };
  }, []);

  useEffect(() => {
    if (currentTitleIndex < aboutTitles.length) {
      animateTitle(aboutTitles[currentTitleIndex], 200); // Speed of letter animation (200ms per letter)
    } else {
      // Reset the index if it exceeds the array length
      setCurrentTitleIndex(0);
    }
  }, [currentTitleIndex]);

  const animateTitle = (title, letterDelay) => {
    clearInterval(titleTimerRef.current); // Clear any existing interval

    let currentLetterIndex = 0;

    setCurrentTitle(''); // Reset the title before starting the animation

    titleTimerRef.current = setInterval(() => {
      if (currentLetterIndex < title.length) {
        setCurrentTitle((prev) => prev + title[currentLetterIndex]);
        currentLetterIndex += 1;
      } else {
        clearInterval(titleTimerRef.current); // Stop the letter animation
        // Move to the next title after a delay
        setTimeout(() => {
          setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % aboutTitles.length);
        }, 1000); // Delay before switching to the next title (1 second)
      }
    }, letterDelay);
  };

  const startAboutTitlesAnimation = (titleDuration) => {
    titlesTimerRef.current = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % aboutTitles.length);
    }, titleDuration); // Total duration for each title (including animation and delay)
  };

  const stopAboutTitlesAnimation = () => {
    clearInterval(titlesTimerRef.current);
    clearInterval(titleTimerRef.current);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentTitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default AboutTitleAnimation;