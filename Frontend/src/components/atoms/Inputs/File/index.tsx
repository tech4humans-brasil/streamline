import {
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
  FormLabel,
  FormControl,
  useToast,
  CircularProgress,
  InputRightElement,
  Flex,
  IconButton,
} from "@chakra-ui/react";
import React, { useRef, useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { FiFile, FiCheckCircle, FiAlertCircle, FiDownload } from "react-icons/fi";
import ErrorMessage from "../ErrorMessage";
import InfoTooltip from "../InfoTooltip";
import { BlockBlobClient } from "@azure/storage-blob";
import { getSasUrl } from "@apis/response";
import { convertFileToArrayBuffer } from "@utils/convertFileToArrayBuffer";
import { FileUploaded } from "@interfaces/Answer";
import {
  FaFileAudio,
  FaFileImage,
  FaFilePdf,
  FaFileVideo,
} from "react-icons/fa";
import { AxiosError } from "axios";

interface FileProps {
  input: {
    id: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    describe?: string | null;
  };
}

const File: React.FC<FileProps> = ({ input }) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { ref, ...rest } = register(input.id + "file") as {
    ref: (instance: HTMLInputElement | null) => void;
  };

  const formValue = watch(input.id) as FileUploaded | null;
  const [loadedBytes, setLoadedBytes] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<
    "success" | "error" | "uploading" | null
  >(formValue ? "success" : null);

  const leftIcon = useCallback(() => {
    if (formValue) {
      if (formValue.mimeType.startsWith("image")) {
        return <Icon as={FaFileImage} />;
      } else if (formValue.mimeType.startsWith("audio")) {
        return <Icon as={FaFileAudio} />;
      } else if (formValue.mimeType.startsWith("video")) {
        return <Icon as={FaFileVideo} />;
      } else if (formValue.mimeType === "application/pdf") {
        return <Icon as={FaFilePdf} />;
      }
    }

    return <Icon as={FiFile} />;
  }, []);

  const rightIcon = useCallback(() => {
    switch (uploadStatus) {
      case "success":
        return <Icon as={FiCheckCircle} color="green.500" />;
      case "error":
        return <Icon as={FiAlertCircle} color="red.500" />;
      case "uploading":
        return <CircularProgress value={loadedBytes} size="20px" />;
      default:
        return null;
    }
  }, [uploadStatus, loadedBytes]);

  const uploadFile = useCallback(async (file: File) => {
    setUploadStatus("uploading");
    const response = await getSasUrl({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    }).catch((e: AxiosError<{ message?: string }>) => {
      toast({
        title: "Erro ao realizar upload do arquivo",
        description: e.response?.data?.message ?? "Erro  ao realizar upload",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      setUploadStatus("error");
    });

    if (!response) return;

    const blobClient = new BlockBlobClient(response.data.url);
    const arrayBuffer = await convertFileToArrayBuffer(file);

    if (!arrayBuffer) return;

    blobClient
      .uploadData(arrayBuffer, {
        blobHTTPHeaders: {
          blobContentType: file.type,
        },
        onProgress: (e) => {
          setLoadedBytes((e.loadedBytes / arrayBuffer.byteLength) * 100);
        },
      })
      .then(() => {
        setUploadStatus("success");
        setValue(input.id, {
          containerName: response.data.containerName,
          name: response.data.fileName,
          url: blobClient.url,
          mimeType: file.type,
          size: arrayBuffer.byteLength.toString(),
        });
      })
      .catch((e) => {
        setUploadStatus("error");
        toast({
          title: "Erro ao realizar upload do arquivo",
          description: e.message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      });
  }, []);

  const handleDownload = useCallback(() => {
    if (formValue?.url) {
      window.open(formValue.url, '_blank');
    }
  }, [formValue]);

  return (
    <FormControl
      id={input.id}
      isInvalid={!!errors?.[input.id]}
      isRequired={input.required}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "start",
          position: "relative",
        }}
      >
        <FormLabel>{input.label}</FormLabel>
      </div>
      <InfoTooltip describe={input.describe} />
      <Flex gap={2}>
        <InputGroup
          onClick={() => {
            if (uploadStatus !== "uploading") inputRef.current?.click();
          }}
        >
          <InputLeftElement pointerEvents="none">{leftIcon()}</InputLeftElement>
          <Input
            type="file"
            ref={(e) => {
              ref(e);
              inputRef.current = e;
            }}
            onChange={(e) => {
              e.target.files?.[0] && uploadFile(e.target.files[0]);
            }}
            hidden
            disabled={uploadStatus === "uploading"}
            required={false}
          />
          <Input
            name={input.id}
            {...rest}
            type="text"
            cursor={uploadStatus === "uploading" ? "not-allowed" : "pointer"}
            placeholder={formValue?.name?.split("@")?.pop()}
            readOnly
          />
          <InputRightElement>{rightIcon()}</InputRightElement>
        </InputGroup>
        
        {formValue?.url && (
          <IconButton 
            aria-label="Download"
            onClick={handleDownload}
            icon={<FiDownload />}
            size="md"
            colorScheme="blue"
          >
          </IconButton>
        )}
      </Flex>
      <ErrorMessage id={input.id} />
    </FormControl>
  );
};

export default File;
