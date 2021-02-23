pragma solidity ^0.5.16;


import './SafeMath.sol';

/**
 * @title ChainwebProof
 * @dev Validates SPV events proofs from Kadena's Chainweb network.
 */
library ChainwebEventsProof {
  using SafeMath for uint256;

  // All param integers are 256 bit (32 bytes)
  uint sizeOfParamInt = 32;

  /**
   * @dev Represents all possible Chainweb Event parameter types.
   * NOTE: Order of enums also corresponds to these type's respective tags
   *       when they are encoded in Chainweb binary representation.
   *       For example, all ByteString parameters start with the `0x00` byte tag.
   */
  enum ParameterType {
    ParamBytes,  // 0x0
    ParamInt  // 0x1
  }

  /**
   * @dev Represents the parameter type and associated raw bytes of a Chainweb
   *      Event parameter with type byte tag stripped.
   * NOTE: The `paramValue` field was purposedly made into a bytes array.
   *       This allows grouping parameters that parse to different (Solidity)
   *       types into a single array since Solidity does not allow arrays of
   *       different types nor does it support sum types.
   *
   *       Therefore, to finalize the conversion, clients should utilize
   *       helper functions to convert `paramValue` into the appropriate
   *       Solidity type based on its `paramType` and `paramSize`.
   *
   */
  struct Parameter {
    ParameterType paramType;
    bytes paramValue;
    uint paramSize;
  }

  /**
   * @dev Represents a Chainweb event, its parameters, as well as the module
   *      and module hash in which it occurred.
   */
  struct Event {
    bytes eventName;
    bytes eventModule;
    bytes eventModuleHash;
    Parameter[] eventParams;
  }

  /* ===========================
   *  INTERNAL HELPER FUNCTIONS
   * ===========================
   **/

   /**
   * @dev Converts a sub-array of bytes into a left-endian 32 byte integer.
   * @param b Bytes array containing the sub-array of bytes that will be
   *          converted into an integer.
   * @param ptr Start index of the sub-array of bytes to convert.
   * @param sizeInBytes Size of the sub-array of bytes to convert.
   */
  /** TODO: negative numbers **/
  function readIntLE(
    bytes memory b,
    uint ptr,
    uint256 sizeInBytes
  ) internal pure returns (uint256) {
    uint256 value = 0;
    uint256 k = sizeInBytes - 1;

    for (uint i = ptr; i < (ptr + sizeInBytes); i++) {
      value = value + uint256(uint8(b[i]))*(2**(8*(4-(k+1))));
      k -= 1;
    }

    return value;
  }

  /**
  * @dev Reads a sub-array of bytes and returns it.
  * @param b Bytes array containing the sub-array of bytes to return.
  * @param ptr Start index of the sub-array of bytes.
  * @param sizeInBytes Size of the sub-array of bytes.
  */
  function readByteString(
    bytes memory b,
    uint ptr,
    uint256 sizeInBytes
  ) internal pure returns (bytes memory) {
    bytes memory value = new bytes(sizeInBytes);
    uint j = 0;

    for (uint i = ptr; i < (ptr + sizeInBytes); i++) {
      value[j] = b[i];
      j += 1;
    }

    return value;
  }

  /* =========================
   *  EVENT PARSING FUNCTIONS
   * =========================
   **/

  /**
  * @dev Parses a Chainweb event parameter of type ByteString.
  * @param b Bytes array containing the sub-array of bytes to return.
  * @param ptr Start index of the sub-array of bytes.
  *
  * The ByteString event parameter will have the following format:
  * |-- 1 byte (a) --||-- 4 bytes (b) --||-- n bytes (c) --|
  *
  * (a): The first byte is `0x00`, the ByteString Param tag.
  * (b): The next 4 bytes encodes the size (a left-endian integer) of the
  *      ByteString parameter in bytes.
  * (c): The rest `n` bytes encodes the actual parameter ByteString.
  *
  * @return currIdx (Ending index + 1) of the sub-array.
  * @return parsed Just the parsed array of bytes.
  *
  */
  function parseBytesParam(bytes memory b, uint idx) public pure
    returns (uint, bytes memory){
      uint currIdx = idx;

      bytes1 bytesTag = b[idx];
      currIdx += 1;
      require(bytesTag == ParamBytes,
              "parseBytesParam: expected 0x0 tag not found");

      uint256 numOfBytes = readIntLE(b, currIdx, 4);
      currIdx += 4;

      bytes memory parsed = readByteString(b, currIdx, numOfBytes);
      currIdx += numOfBytes;

      return (currIdx, parsed);
  }

  /**
  * @dev Parses a Chainweb event parameter of type (left-endian) Integer.
  * @param b Bytes array containing the sub-array of bytes to convert.
  * @param ptr Start index of the sub-array of bytes.
  * @param isTagged Boolean to indicate if sub-array contains the Integer
  *                 parameter tag (i.e. does the byte array start with `0x01`).
  *
  * The Integer event parameter will have the following format:
  * |-- 1 byte (a) --||-- 32 bytes (b) --|
  *
  * (a): The first byte is `0x01`, the Integer Param tag.
  * (b): The next 4 bytes encodes the size `n` (a left-endian integer)
  *      in number of bytes of the ByteString parameter.
  * (c): The next 32 bytes encodes the bytes sub-array representing
  *      the (left-endian) integer parameter.
  *
  * NOTE: This function will mostly be used by clients to convert the raw
  *       integer bytes returned by `parseParam` into a Solidity integer.
  *       Since the `parseParam` function returns the raw bytes without the
  *       integer type tag, then clients should call this function with
  *       `isTagged` set to false.
  *
  * @return currIdx (Ending index + 1) of the sub-array converted.
  * @return value The parsed integer parameter as a Solidity 256 bit (32 byte)
  *               integer.
  *
  */
  function parseIntLEParam(bytes memory b, uint idx, bool isTagged) public pure
    returns (uint, uint256){
      uint currIdx = idx;

      if (isTagged == true) {
        bytes1 intTag = b[idx];
        currIdx += 1;
        require(bytesTag == ParamInt,
                "parseIntLEParam: expected 0x01 tag not found");
      }

      uint256 value = readIntLE(b, currIdx, sizeOfInt);
      currIdx += sizeOfInt;

      return (currIdx, value);
  }

  /**
  * @dev Parses a Chainweb event parameter depending on the parameter's type tag.
  * @param b Bytes array containing the sub-array of bytes to convert.
  * @param ptr Start index of the sub-array of bytes.
  *
  * The event parameter will have the following format:
  * |-- 1 byte (a) --||-- n bytes (b) --|
  *
  * (a): The first byte is the parameter type tag.
  *      See `ParameterType` for more details.
  * (b): The next n bytes encodes the parameter value using the encoding scheme
  *      determined by its type tag (a).
  *
  * @return currIdx (Ending index + 1) of the sub-array parsed.
  * @return param The EventParam struct containing the type of the parameter,
  *               the raw bytes associated with it, and the size in bytes
  *               of the parameter.
                  NOTE: The raw bytes is stripped of all type
  *               type tags and size encodings for ByteString and Integer types.
  *
  */
  function parseParam(bytes memory b, uint idx) public pure
    return (uint, EventParam memory) {
      uint currIdx = idx;

      // peek at the value of the type tag, but don't update index
      bytes1 tag = b[currIdx];

      if (tag == ParamBytes) {
        // `parseBytesParam` expects the tag byte
        (sizeOfParam, parsed) = parseBytesParam(b, currIdx);
        currIdx += sizeOfParam;
        EventParam param = EventParam(ParamBytes, parsed);
        return (currIdx, param);
      }
      else if (tag == ParamInt) {
        currIdx += 1;  // skips over tag byte

        /** NOTE: Gets raw integer bytes to make it easier to group parameters
        *         of different types. Clients will need to use `parseIntLEParam`
        *         to convert these bytes into their integer value.
        *         See `Parameter` struct documentation for more details.
        **/
        intBytes = readByteString(b, currIdx, sizeOfIntParam);
        currIdx += sizeOfIntParam;
        EventParam param = EventParam(ParamInt, intBytes);
        return (currIdx, param);
      }
      else {
        revert("parseParam: Invalid event param tag");
      }
  }

  /**
  * @dev Parses an array of Chainweb event parameters.
  * @param b Bytes array containing the sub-array of bytes to convert.
  * @param ptr Start index of the sub-array of bytes.
  *
  * The array of event parameters will have the following format:
  * |-- 4 bytes (a) --||-- 1st n bytes (b) --|...|-- jth m bytes (b) --|
  *
  * (a): The first 4 bytes (left-endian) encodes the size of the array in bytes.
  * (b): The rest of the bytes holds the paramters in their respective binary
  *      encoding in sequential order and one right after the other.
  *      See `parseParam` for more details.
  *
  * @return currIdx (Ending index + 1) of the sub-array parsed.
  * @return params The EventParam array containing the parsed parameters.
  *
  */
  function parseParamsArray(bytes memory b, uint idx) public pure
    return (uint, EventParam[] memory) {
      uint currIdx = idx;

      uint256 numOfParams = readIntegerLE(b, currIdx, 4);
      currIdx += 4

      EventParam[] params = new array(numOfParams);

      for (uint j = 0; i < numOfParams; i++) {
        (endIdx, eventParam) = parseParam(b, currIdx);
        currIdx = endIdx;
        params[j] = eventParam;
      }

      return (currIdx, params);
    }

  /**
  * @dev Parses a Chainweb event.
  * @param b Bytes array containing the sub-array of bytes to convert.
  * @param ptr Start index of the sub-array of bytes.
  *
  * The array of events will have the following format:
  * |-- n bytes (a) --||-- m bytes (b) --||-- o bytes (c) --||-- p bytes (d) --|
  *
  * (a): The first n bytes encodes the event name as a ByteString type
  *      (see `parseBytesParam` for encoding details).
  * (b): The next m bytes encodes as a ByteString type the module name where
  *      this event was emitted.
  * (c): The next o bytes encodes as a ByteString type the hash of the module
  *      where this event was emitted.
  * (d): The next p bytes encodes the array of parameters this event was called
  *      with
  *
  * NOTE: See `parseBytesParam` for encoding details on how (a)-(c) where
  *       parsed, and see `parseParamsArray` for details on how (d) was
  *       parsed.
  *
  * @return currIdx (Ending index + 1) of the sub-array parsed.
  * @return params The Event struct containing the parsed event fields.
  *
  */
  function parseEvent(bytes memory b, uint idx) public pure
    return (Event memory) {
      uint currIdx = idx;

      (_, sizeOfEventName, eventName) = parseBytesParam(b, currIdx);
      currIdx += sizeOfEventName;
      (_, sizeOfEventModule, eventModule) = parseBytesParam(b, currIdx);
      currIdx += sizeOfEventModule;
      (_, sizeOfModuleHash, moduleHash) = parseBytesParam(b, currIdx);
      currIdx += sizeOfModuleHash;
      (paramArrEndIdx, params) = parseParamsArray(b, currIdx);
      currIdx = paramArrEndIdx;

      ChainwebEvent event = Event(eventName,eventModule,eventModuleHash,params);

      return (currIdx, event);
  }

  /**
  * @dev Parses an array of Chainweb events.
  * @param b Bytes array containing the sub-array of bytes to convert.
  * @param ptr Start index of the sub-array of bytes.
  *
  * The array of events will have the following format:
  * |-- 4 bytes (a) --||-- 1st n bytes (b) --|...|-- jth m bytes (b) --|
  *
  * (a): The first 4 bytes (left-endian) encodes the size of the array in bytes.
  * (b): The rest of the bytes holds the events in their respective binary
  *      encoding in sequential order and one right after the other.
  *      See `parseEvent` for details.
  *
  * @return currIdx (Ending index + 1) of the sub-array parsed.
  * @return events The Event array containing the parsed events.
  *
  */
  function parseEventsArray(bytes memory b, uint idx) public pure
    return (Event[] memory) {
      uint currIdx = idx;

      uint256 numOfEvents = readIntLE(b, currIdx, 4);
      currIdx += 4;

      ChainwebEvents[] events = new array(numOfEvents);

      for (uint i = 0; i < numOfEvents; i++) {
        (eventEndIdx, event) = parseEvent(b, currIdx);
        currIdx = eventEndIdx;
        events[i] = event;
      }

      return (currIdx, events);
  }


  /**
  * @dev Parses an event-based merkle proof subject emitted by Kadena's public
  *      blockchain.
  * @param b Bytes array containing all of the proof subject.
  *
  * The subject will have the following format:
  * |-- n bytes (a) --||-- 1st m bytes (b) --|...|-- jth o bytes (b) --|
  *
  * (a): The first n bytes encodes as a ByteString type the request key of the
  *      transaction emitting the events.
  *      See `parseBytesParam` for more details.
  * (b): The rest of the bytes holds the array of events in its respective binary
  *      encoding, in sequential order, and one right after the other.
  *      See `parseEventsArray` for more details.
  *
  * @return reqKey The bytes of the parsed Request Key.
  * @return events The Event array containing the parsed events.
  *
  */
  function parseProofSubject(bytes memory b) public pure
    returns (bytes[], Event[] memory){
      uint256 currIdx = 0;
      (reqKeyEndIdx, reqKey) = parseBytesParam(b, currIdx);
      currIdx = reqKeyEndIdx;
      events = parseEventsArray(b, currIdx);
      return (reqKey, events);
  }

}
