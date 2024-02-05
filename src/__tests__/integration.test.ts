import { get } from '../accessors';
import { propose } from '../changes/changes';
import { Book, Chapter } from './Book';

const ob: Book = new Book('Book Title', 2020, [new Chapter('Introduction', 1)]);

const value = get(ob, 'title');
console.log(value);

propose(ob, [['title', 'Modified Book Title']]);
console.log(ob.proposed?.title);
