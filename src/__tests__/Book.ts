import { getOriginals, getProposed } from "../changes/getStore.js";

export class Book {
  id: string;
  author!: Author;
  constructor(
    public title: string,
    public year: number,
    public chapters: Chapter[],
  ) {
    this.id = "42";
  }

  get original() {
    return getOriginals(this, "original", "proposed");
  }
  get proposed() {
    return getProposed(this, "original", "proposed");
  }
}

export class Chapter {
  id: string;
  author!: Author;
  parent!: Book;
  constructor(
    public title: string,
    public order: number,
  ) {
    this.id = "24";
  }
}

class Author {
  name!: string;
}
