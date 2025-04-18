import React, { useState, useEffect } from 'react';
import { View, Animated, KeyboardAvoidingView, Platform, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LanguageSelector } from './components/LanguageSelector';
import { KeywordsList } from './components/KeywordsList';
import { MessageArea } from './components/MessageArea';
import { ChatInput } from './components/ChatInput';
import { SelectedText } from './components/SelectedText';
import { KeywordDetail } from './components/KeywordDetail';
import { DocumentService } from '../../../../services/DocumentService';
import { Document } from '../../../../services/FileService';
import { sharedStyles } from './styles/sharedStyles';
import { AIAnalysisPanelProps, Keyword, Language, ConceptMap } from './types';
import { LANGUAGES } from '../../../../components/LanguageSelector';

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  visible,
  selectedText,
  documentUri,
  documentType,
  animValue,
  keyboardHeight,
  keyboardVisible,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [geminiResponse, setGeminiResponse] = useState<string>('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null);
  const [conceptMapLoading, setConceptMapLoading] = useState(false);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0]
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  useEffect(() => {
    if (visible) {
      analyzeWithGemini(selectedText);
      extractKeywords(selectedText);
    }
  }, [visible, selectedText, selectedLanguage.code]);

  const analyzeWithGemini = async (text: string, instruction: string = "Explain this text in an educational manner") => {
    setGeminiLoading(true);
    setGeminiResponse('');
    
    try {
      const doc: Document = {
        id: `selection-${Date.now()}`,
        title: 'Current Document',
        type: documentType,
        uri: documentUri,
        date: new Date()
      };
      
      const response = await DocumentService.analyzeText(
        doc,
        text,
        instruction,
        selectedLanguage.code
      );
      
      setGeminiResponse(response);
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGeminiResponse(`Error analyzing text: ${errorMessage}`);
    } finally {
      setGeminiLoading(false);
    }
  };

  const extractKeywords = async (text: string) => {
    setKeywordsLoading(true);
    
    try {
      const doc: Document = {
        id: `selection-${Date.now()}`,
        title: 'Current Document',
        type: documentType,
        uri: documentUri,
        date: new Date()
      };
      
      const response = await DocumentService.extractKeywords(
        doc,
        text,
        selectedLanguage.code
      );
      
      try {
        const jsonStart = response.indexOf('[');
        const jsonEnd = response.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = response.substring(jsonStart, jsonEnd);
          const parsedKeywords = JSON.parse(jsonStr) as Keyword[];
          
          const validKeywords = parsedKeywords.filter(k => 
            k && typeof k.concept === 'string' && 
            typeof k.definition === 'string' && 
            typeof k.importanceScore === 'number'
          );
          
          setKeywords(validKeywords);
        } else {
          console.error('Could not find JSON in response:', response);
          setKeywords([]);
        }
      } catch (parseError) {
        console.error('Error parsing keywords JSON:', parseError);
        setKeywords([]);
      }
    } catch (error) {
      console.error('Error extracting keywords:', error);
    } finally {
      setKeywordsLoading(false);
    }
  };

  const generateConceptMap = async () => {
    if (!selectedText) return;
    
    setConceptMapLoading(true);
    
    try {
      const doc: Document = {
        id: `selection-${Date.now()}`,
        title: 'Current Document',
        type: documentType,
        uri: documentUri,
        date: new Date()
      };
      
      const response = await DocumentService.generateConceptMap(
        doc,
        selectedText,
        undefined,
        selectedLanguage.code
      );
      
      try {
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = response.substring(jsonStart, jsonEnd);
          const parsedConceptMap = JSON.parse(jsonStr) as ConceptMap;
          setConceptMap(parsedConceptMap);
          
          // Generate and display an explanation of the concept map
          const conceptMapExplanation = 
            `# Concept Map: ${parsedConceptMap.centralConcept}\n\n` +
            `${parsedConceptMap.summary}\n\n` +
            `## Key Concepts:\n` +
            parsedConceptMap.nodes.map(node => `- ${node.label}`).join('\n');
          
          setGeminiResponse(conceptMapExplanation);
        } else {
          console.error('Could not find JSON in concept map response:', response);
        }
      } catch (parseError) {
        console.error('Error parsing concept map JSON:', parseError);
      }
    } catch (error) {
      console.error('Error generating concept map:', error);
    } finally {
      setConceptMapLoading(false);
    }
  };

  const explainSimply = async (level: 'child' | 'teenager' | 'non-expert' = 'non-expert') => {
    if (!selectedText) return;
    setGeminiLoading(true);
    
    try {
      const doc: Document = {
        id: `selection-${Date.now()}`,
        title: 'Current Document',
        type: documentType,
        uri: documentUri,
        date: new Date()
      };
      
      // Use the first keyword/concept as the target concept or "this concept" if none available
      const targetConcept = keywords.length > 0 ? keywords[0].concept : "this concept";
      
      const response = await DocumentService.explainSimply(
        doc,
        selectedText,
        targetConcept,
        level,
        selectedLanguage.code
      );
      
      try {
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = response.substring(jsonStart, jsonEnd);
          const explanation = JSON.parse(jsonStr);
          
          const formattedExplanation = 
            `# ${explanation.concept} Explained\n\n` +
            `${explanation.hook}\n\n` +
            `${explanation.coreExplanation}\n\n` +
            `## Using Analogies\n${explanation.analogies.map((a: string) => `- ${a}`).join('\n')}\n\n` +
            `## Common Misconceptions\n${explanation.commonMisconceptions.map((m: string) => `- ${m}`).join('\n')}\n\n` +
            `## Summary\n${explanation.summary}`;
          
          setGeminiResponse(formattedExplanation);
        } else {
          setGeminiResponse(response);
        }
      } catch (parseError) {
        console.error('Error parsing explanation JSON:', parseError);
        setGeminiResponse(response);
      }
    } catch (error) {
      console.error('Error generating explanation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGeminiResponse(`Error explaining: ${errorMessage}`);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleSendPress = () => {
    if (!inputText.trim()) return;
    
    // Check for special commands
    if (inputText.toLowerCase().includes('concept map')) {
      generateConceptMap();
    } else if (inputText.toLowerCase().includes('explain simply') || 
               inputText.toLowerCase().includes('explain for kids')) {
      explainSimply('child');
    } else if (inputText.toLowerCase().includes('explain for teenagers')) {
      explainSimply('teenager');
    } else if (inputText.toLowerCase().includes('simplify')) {
      explainSimply('non-expert');
    } else {
      // Default behavior - analyze with custom instruction
      analyzeWithGemini(selectedText, inputText);
    }
    
    setInputText('');
  };

  const handleKeywordPress = (keyword: Keyword) => {
    setSelectedKeyword(keyword);
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
    
    if (visible && selectedText) {
      setGeminiResponse('');
      setKeywords([]);
      
      setTimeout(() => {
        analyzeWithGemini(selectedText);
        extractKeywords(selectedText);
      }, 50);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        sharedStyles.chatWindow,
        {
          opacity: opacity,
          transform: [{ translateY: translateY }],
          bottom: keyboardVisible ? keyboardHeight - 50 : 30,
        }
      ]}
    >
      <View style={sharedStyles.chatHeader}>
        <View style={sharedStyles.titleContainer}>
          <Text style={sharedStyles.chatTitle}>AI Learning Assistant</Text>
          
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            showDropdown={showLanguageDropdown}
            onLanguageSelect={handleLanguageChange}
            onToggleDropdown={() => setShowLanguageDropdown(!showLanguageDropdown)}
            languages={LANGUAGES}
          />
        </View>
        
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        style={sharedStyles.keyboardAvoidContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.content}>
          <SelectedText text={selectedText} />
          
          <KeywordsList
            keywords={keywords}
            loading={keywordsLoading}
            onKeywordPress={handleKeywordPress}
          />

          {selectedKeyword && (
            <KeywordDetail
              keyword={selectedKeyword}
              onClose={() => setSelectedKeyword(null)}
            />
          )}
          
          <MessageArea
            response={geminiResponse}
            loading={geminiLoading || conceptMapLoading}
          />
          
          <ChatInput
            value={inputText}
            onChange={setInputText}
            onSend={handleSendPress}
            placeholder="Ask a question, create a concept map, or ask to simplify..."
          />
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '400',
  },
});

export default AIAnalysisPanel; 