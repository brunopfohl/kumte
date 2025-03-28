import { Document } from './FileService';

/**
 * Service to handle document content and AI operations
 */
export class DocumentService {
  /**
   * Get document content (simulated for now)
   */
  static async getDocumentContent(document: Document): Promise<string> {
    // Simulate getting document content - in a real app this would parse the document
    return new Promise((resolve) => {
      setTimeout(() => {
        if (document.type === 'pdf') {
          resolve(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. 
          Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.

          Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, 
          euismod non, mi. Proin porttitor, orci nec nonummy molestie.

          Fusce neque. Etiam posuere lacus quis dolor. Praesent lectus.`);
        } else {
          resolve('Image document content (extracted text from OCR would appear here)');
        }
      }, 300);
    });
  }

  /**
   * Summarize document (simulated for now)
   */
  static async summarizeDocument(
    document: Document, 
    options: { type: 'brief' | 'detailed' | 'bullet' } = { type: 'brief' }
  ): Promise<string> {
    // Simulate AI summarization
    return new Promise((resolve) => {
      setTimeout(() => {
        const summaries = {
          brief: 'This document discusses key project objectives and requirements.',
          detailed: `This document provides a comprehensive overview of the project scope, 
          objectives, and requirements. It outlines specific tasks that need to be accomplished,
          along with timelines and resource allocations.`,
          bullet: `• Project objectives defined\n• Requirements documented\n• Timeline established\n• Resources allocated`,
        };
        
        resolve(summaries[options.type]);
      }, 1500);
    });
  }

  /**
   * Extract information from document (simulated for now)
   */
  static async extractInformation(
    document: Document,
    extractType: 'keyPoints' | 'dates' | 'custom' = 'keyPoints'
  ): Promise<string> {
    // Simulate AI information extraction
    return new Promise((resolve) => {
      setTimeout(() => {
        const extractions = {
          keyPoints: `Key points extracted:\n
          - Main argument focuses on improving efficiency
          - Three solutions proposed
          - Implementation timeline of 6 months
          - Budget requirements outlined in section 3`,
          
          dates: `Dates found:\n
          - Project Start: January 15, 2023
          - Phase 1 Completion: March 30, 2023
          - Final Deadline: June 30, 2023`,
          
          custom: `Custom information extraction.\n
          In a real implementation, this would extract specific information
          as requested by the user.`
        };
        
        resolve(extractions[extractType]);
      }, 1500);
    });
  }

  /**
   * Translate document (simulated for now)
   */
  static async translateDocument(
    document: Document,
    language: 'spanish' | 'french' | 'german' = 'spanish'
  ): Promise<string> {
    // Simulate AI translation
    return new Promise((resolve) => {
      setTimeout(() => {
        const translations = {
          spanish: `Este documento proporciona una visión general del alcance del proyecto,
          los objetivos y los requisitos. Describe tareas específicas que deben realizarse,
          junto con cronogramas y asignaciones de recursos.`,
          
          french: `Ce document fournit un aperçu complet de la portée du projet,
          des objectifs et des exigences. Il décrit les tâches spécifiques à accomplir,
          ainsi que les délais et les allocations de ressources.`,
          
          german: `Dieses Dokument bietet einen umfassenden Überblick über den Projektumfang,
          Ziele und Anforderungen. Es beschreibt spezifische Aufgaben, die erledigt werden müssen,
          zusammen mit Zeitplänen und Ressourcenzuweisungen.`
        };
        
        resolve(translations[language]);
      }, 1500);
    });
  }

  /**
   * Chat about document (simulated for now)
   */
  static async chatWithAI(
    document: Document, 
    message: string
  ): Promise<string> {
    // Simulate AI chat response
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          `Based on this document, I can tell you that the main points are about project planning and resource allocation.`,
          `The document mentions several key dates including a project kickoff on January 15th.`,
          `This appears to be a ${document.type === 'pdf' ? 'PDF document' : 'scanned image'} containing information about business requirements.`,
          `I've analyzed the content and found that it primarily discusses methodology and implementation strategies.`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        resolve(randomResponse);
      }, 1000);
    });
  }
} 