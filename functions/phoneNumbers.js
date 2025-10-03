function getNumberFromGreenApiFormat(fullNumberString) {
  console.log('fullNumberString: ', fullNumberString);
    // Check if the input is a string and contains '@c.us'
    if (typeof fullNumberString !== 'string' || !fullNumberString.includes('@c.us')) {
      console.error("Invalid input format. Expected a string like 'XXXXXXXXXXXX@c.us'.");
      return ""; // Return an empty string or handle error as appropriate
    }
  
    // Find the index of the '@' symbol
    const atIndex = fullNumberString.indexOf('@');
  
    // Ensure '@' was found and there are enough characters before it
    if (atIndex === -1 || atIndex < 3) {
      console.error("Invalid number format: '@' not found or not enough characters before it.");
      return "";
    }
  
    // Extract the substring starting from the 4th character (index 3)
    // up to the character just before the '@' symbol (atIndex)
    const extractedPart = fullNumberString.substring(3, atIndex);
  
    // Add '0' to the beginning of the extracted part
    return '0' + extractedPart;
  }

  function formatIsraeliPhoneNumberToGreenAPI(israeliPhoneNumber) {
    // Basic validation: Check if it's a string and starts with '05'
    if (typeof israeliPhoneNumber !== 'string' || !israeliPhoneNumber.startsWith('05')) {
      console.error("Invalid Israeli phone number format. Expected '05X...'");
      return '';
    }
  
    // Remove the leading '0'
    const numberWithoutLeadingZero = israeliPhoneNumber.substring(1);
  
    // Prepend '972' and append '@c.us'
    const formattedNumber = `972${numberWithoutLeadingZero}@c.us`;
  
    return formattedNumber;
  }
  module.exports = {getNumberFromGreenApiFormat, formatIsraeliPhoneNumberToGreenAPI}