from pydantic import BaseModel, Field
from typing import List


class FileInput(BaseModel):
    path: str = Field(min_length=1)
    content: str = Field(min_length=1)


class CodeBundle(BaseModel):
    bundleId: str = Field(min_length=1)
    language: str = Field(min_length=1)
    files: List[FileInput]
