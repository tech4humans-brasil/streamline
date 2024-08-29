import { Types } from "mongoose";
import {
  FieldTypes,
  IField,
  IFormDraft,
  IValue,
} from "../../models/client/FormDraft";
import { IUser } from "../../models/client/User";
import BlobUploader, { FileUploaded } from "../../services/upload";
import UserRepository from "../../repositories/User";

interface File {
  name: string;
  mimeType: string;
  base64: string;
}

interface File {
  name: string;
  mimeType: string;
  base64: string;
}

class ResponseUseCases {
  private readonly formDraft: IFormDraft;
  private readonly blobUploader: BlobUploader;
  private readonly userRepository: UserRepository;
  private grade = 0;

  constructor(
    formDraft: IFormDraft,
    blobUploader: BlobUploader,
    userRepository: UserRepository
  ) {
    this.formDraft = formDraft;
    this.blobUploader = blobUploader;
    this.userRepository = userRepository;
  }

  async processFormFields(rest: Record<string, any>) {
    for (const field of this.formDraft.fields) {
      let value = rest[field.id];
      await this.processFields(field, value);
    }
  }

  private async processFields(field: IField, value: any) {
    let mapped: IValue = null;

    if (!value || (Array.isArray(value) && !value.length)) {
      field.value = value;
      return;
    }

    if (field.type === FieldTypes.File && typeof value === "object") {
      const file: FileUploaded = value as FileUploaded;

      mapped = file;
    }

    // if (field.type === FieldTypes.Teacher && Array.isArray(value)) {
    //   const teachers = await this.userRepository.find({
    //     where: {
    //       _id: {
    //         $in: value.map((val) => val?._id).filter((val) => val),
    //       },
    //     },
    //     select: {
    //       _id: 1,
    //       name: 1,
    //       email: 1,
    //       matriculation: 1,
    //       institute: 1,
    //     },
    //   });

    //   mapped = value.map((val) => {
    //     if (typeof val === "string") {
    //       return teachers.find((teacher) => String(teacher._id) === val);
    //     }

    //     if (typeof val === "object") {
    //       if (val?._id) {
    //         return teachers.find((teacher) => String(teacher._id) === val._id);
    //       }

    //       return {
    //         ...val,
    //         isExternal: true,
    //         _id: new Types.ObjectId(),
    //       };
    //     }
    //   });
    // }

    field.value = mapped || value;
  }

  getGrade() {
    return this.grade;
  }
}

export default ResponseUseCases;
