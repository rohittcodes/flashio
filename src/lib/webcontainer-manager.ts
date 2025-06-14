// WebContainer Manager - Singleton for managing WebContainer instances
import { WebContainer } from '@webcontainer/api';

class WebContainerManager {
  private static instance: WebContainerManager;
  private webContainer: WebContainer | null = null;
  private currentProjectId: string | null = null;

  private constructor() {}

  public static getInstance(): WebContainerManager {
    if (!WebContainerManager.instance) {
      WebContainerManager.instance = new WebContainerManager();
    }
    return WebContainerManager.instance;
  }

  /**
   * Get a WebContainer instance, reusing the existing one if possible
   */  public async getWebContainer(projectId: string, options: any = {}): Promise<WebContainer> {
    // First check if there's a WebContainer instance already available in the window object
    // This handles cases where another component has created a WebContainer without using this manager
    if (typeof window !== 'undefined' && (window as any).webContainerInstance) {
      console.log('Using existing WebContainer instance from global scope');
        // Store the reference in our manager for future use
      this.webContainer = (window as any).webContainerInstance;
      this.currentProjectId = (window as any).webContainerInstanceId || projectId;
      
      // Since we confirmed it exists above, we can safely assert it's not null here
      return this.webContainer as WebContainer;
    }
    
    // Check if we're trying to use the same project
    if (this.webContainer && this.currentProjectId === projectId) {
      return this.webContainer;
    }
    
    // If we have a container but for a different project, we need to handle that
    // In a production app, you might want to save the state of the previous container
    
    if (!this.webContainer) {
      try {
        console.log(`Booting new WebContainer for project: ${projectId}`);
        
        // Try to detect and handle any existing WebContainer instances
        if (typeof window !== 'undefined') {
          // Add a flag to track if we're attempting to boot
          (window as any).__webContainerBooting = true;
        }
        
        this.webContainer = await WebContainer.boot({
          coep: 'require-corp',
          ...options,
          workdirName: `project-${projectId}`,
        });
        
        this.currentProjectId = projectId;
        
        if (typeof window !== 'undefined') {
          (window as any).__webContainerBooting = false;
        }
      } catch (error) {
        console.error('Failed to boot WebContainer:', error);
        
        if (typeof window !== 'undefined') {
          (window as any).__webContainerBooting = false;
        }
        
        // Special handling for the "Only a single WebContainer" error
        if (error instanceof Error && error.message.includes('Only a single WebContainer instance can be booted')) {
          // Wait briefly to see if another component might be finishing its own boot process
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check again if a WebContainer instance has become available
          if (typeof window !== 'undefined' && (window as any).webContainerInstance) {            console.log('Recovered WebContainer instance after boot failure');
            this.webContainer = (window as any).webContainerInstance;
            this.currentProjectId = (window as any).webContainerInstanceId || projectId;
            return this.webContainer as WebContainer;
          }
        }
        
        throw new Error(`WebContainer boot failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return this.webContainer;
  }

  /**
   * Used to explicitly terminate a WebContainer instance when done
   */
  public async teardown(): Promise<void> {
    // Currently WebContainer API doesn't have a method to terminate,
    // but we can clear our reference to allow garbage collection
    this.webContainer = null;
    this.currentProjectId = null;
  }

  /**
   * Reset the current WebContainer instance
   */
  public reset(): void {
    this.webContainer = null;
    this.currentProjectId = null;
  }
}

export const webContainerManager = WebContainerManager.getInstance();

// For global access (helpful for debugging)
if (typeof window !== 'undefined') {
  (window as any).webContainerManager = webContainerManager;
}
