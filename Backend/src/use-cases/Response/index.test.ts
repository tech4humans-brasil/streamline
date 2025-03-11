import ResponseUseCases from "./index";

describe("ResponseUseCases", () => {
  let formDraft: any;
  let blobUploader: any;
  let userRepository: any;
  let responseUseCases: any;

  beforeEach(() => {
    formDraft = {
      fields: [
        {
          id: "field1",
          type: "text",
          value: null,
        },
        {
          id: "field2",
          type: "number",
          value: null,
        },
        {
          id: "field3",
          type: "file",
          value: null,
        },
        {
          id: "field4",
          type: "teacher",
          value: null,
        },
      ],
    };

    blobUploader = {
      uploadFileToBlob: jest.fn(),
    };

    userRepository = {
      find: jest.fn(),
    };

    responseUseCases = new ResponseUseCases(
      formDraft,
      blobUploader,
      userRepository
    );
  });

  describe("processFormFields", () => {
    it("should process form fields correctly", async () => {
      const rest = {
        field1: "value1",
        field2: 10,
        field3: {
          name: "file.txt",
          mimeType: "text/plain",
          base64: "base64data",
        },
        field4: [
          { _id: "1", name: "John", email: "john@example.com" },
          { _id: "2", name: "Jane", email: "jane@example.com" },
        ],
      };

      blobUploader.uploadFileToBlob.mockResolvedValueOnce({
        name: "file.txt",
        mimeType: "text/plain",
        base64: "base64data",
      });

      userRepository.find.mockResolvedValueOnce([
        { _id: "1", name: "John", email: "john@example.com" },
        { _id: "2", name: "Jane", email: "jane@example.com" },
      ]);

      await responseUseCases.processFormFields(rest);

      expect(formDraft.fields[0].value).toEqual("value1");
      expect(formDraft.fields[1].value).toEqual(10);
      expect(formDraft.fields[2].value).toEqual({
        name: "file.txt",
        mimeType: "text/plain",
        base64: "base64data",
      });
      expect(formDraft.fields[3].value).toEqual([
        { _id: "1", name: "John", email: "john@example.com" },
        { _id: "2", name: "Jane", email: "jane@example.com" },
      ]);
    });
  });

  describe("getGrade", () => {
    it("should return the grade", () => {
      responseUseCases["grade"] = 100;

      const result = responseUseCases.getGrade();

      expect(result).toEqual(100);
    });
  });

  describe("processFields", () => {
    it("should process text field correctly", async () => {
      const field = formDraft.fields[0];
      const value = "value1";

      await responseUseCases["processFields"](field, value);

      expect(field.value).toEqual(value);
    });

    it("should process number field correctly", async () => {
      const field = formDraft.fields[1];
      const value = 10;

      await responseUseCases["processFields"](field, value);

      expect(field.value).toEqual(value);
    });

    it("should process file field correctly", async () => {
      const field = formDraft.fields[2];
      const value = {
        name: "file.txt",
        mimeType: "text/plain",
        base64: "base64data",
      };

      blobUploader.uploadFileToBlob.mockResolvedValueOnce({
        name: "file.txt",
        mimeType: "text/plain",
        base64: "base64data",
      });

      await responseUseCases["processFields"](field, value);

      expect(field.value).toEqual({
        name: "file.txt",
        mimeType: "text/plain",
        base64: "base64data",
      });
    });

    it("should process teacher field correctly", async () => {
      const field = formDraft.fields[3];
      const value = [{ _id: "1", name: "John", email: "teacher@email.com" }];

      userRepository.find.mockResolvedValueOnce([
        { _id: "1", name: "John", email: "teacher@email.com" },
      ]);

      await responseUseCases["processFields"](field, value);

      expect(field.value).toEqual([
        { _id: "1", name: "John", email: "teacher@email.com" },
      ]);
    });
  });

});
