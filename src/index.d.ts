/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'IC3Client' {
  global {
    interface Window {
      Microsoft: any;
    }
  }
}