declare module 'lzo1x' {
    interface State {
      inputBuffer: Uint8Array;
      outputBuffer: Uint8Array;
    }
  
    interface Lzo1x {
      compress(state: State): number;
      decompress(state: State): number;
    }
  
    const lzo1x: Lzo1x;
  
    export default lzo1x;
  }