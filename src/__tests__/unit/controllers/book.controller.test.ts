import { getBookInfo } from '../../../controllers/book.controller';
import { getBook } from '../../../services/book.service';

jest.mock('../../../services/book.service', () => ({
  getBook: jest.fn(),
}));

describe('Book Controller - getBookInfo', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: {
        id: '1', // mock the ID of the book to be fetched
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 404 if the book is not found', async () => {
    (getBook as jest.Mock).mockResolvedValue(null); // Simulate no book found

    await getBookInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Book not found' });
  });

  it('should return 200 and book data if the book is found', async () => {
    const mockBook = {
      id: 1,
      title: 'Mock Book Title',
      author: { firstName: 'John', lastName: 'Doe' },
      publication_date: new Date('2020-01-01'),
      genres: ['Fiction'],
      isbn: '9780156031448',
      asin: '0156031442',
      image_url: 'http://example.com/image.jpg',
      synopsis: 'This is a mock book synopsis.',
    };

    (getBook as jest.Mock).mockResolvedValue(mockBook); // Simulate book found

    await getBookInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ISBN: mockBook.isbn,
      ASIN: mockBook.asin,
      language: 'English',
      published: mockBook.publication_date.toDateString(),
      edition: 'First edition',
      title: mockBook.title,
      image: mockBook.image_url,
      synopsis: mockBook.synopsis,
      genres: mockBook.genres,
      author: `${mockBook.author.lastName}, ${mockBook.author.firstName}`,
      coauthor_name: '',
      author_description:
        'lorem ipsum dolor sit amet consectetur adipiscing elit',
      good_reads_mean_rating: 4.15,
      good_reads_number_rating: 9695,
      good_reads_summary_ratings: {
        five_stars: 3949,
        four_stars: 3736,
        three_stars: 1583,
        two_stars: 325,
        one_stars: 102,
      },
    });
  });

  it('should call next with error on exception', async () => {
    const mockError = new Error('Test error');
    (getBook as jest.Mock).mockRejectedValue(mockError); // Simulate error in fetching book

    await getBookInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'An error occurred while fetching book info.',
    });
  });
});
