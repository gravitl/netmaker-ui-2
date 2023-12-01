export class TestHelper {
  static hasValue = (val) => {
    return typeof val !== 'undefined' && val !== null && val !== '' && val !== 0;
  };

  static isNothing = (val) => {
    return (
      typeof val === 'undefined' ||
      val === null ||
      (typeof val == 'string' && val.trim().length == 0) ||
      val === 0 ||
      (typeof val === 'object' && Object.entries(val).length === 0) ||
      (Array.isArray(val) && val.length === 0)
    );
  };

  static isNotNullOrUndefined = (prop) => {
    return typeof prop !== 'undefined' && prop !== null;
  };

  /**
   * hex gen helpers
   */
  /*     
    static dec2hex (dec) {
        return dec.toString(16).padStart(2, "0")
    }

    static getRandomChar = (len=8) => {
        let arr = new Uint8Array((len || 40) / 2)
        window.crypto.getRandomValues(arr)
        return Array.from(arr, dec2hex).join('')
    }

    static generateNumber = (digits = 10) => {
        let num = '5' + Math.floor(100000000 + Math.random() * 9000000000).toString()
        return num.slice(0,digits);
    } 
    */
}
