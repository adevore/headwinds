import time
from hashlib import md5


# Super secret key!
SHARED_KEY = "headwinds2sharedsecret"


class HeadWindsClient:
    def __init__(self, server, currentKey, previousKey):
        self.server = server
        self.currentKey = currentKey
        self.previousKey = previousKey
        
    def init_cookie(self, msg, author, email, author_url, short=False):
        """
        Get a Headwinds cookie for the given information
        """
        timestamp = time.strftime("%m.%d.%y")
        data = msg + author + email
        
        if short:
            return {
                "Cookie": checksum,
                "ts": timestamp,
                "S": score,
                }
        else:
            return {
                "Cookie": checksum,
                "ts": timestamp,
                "S": score,
                "comment_author": author,
                "comment_author_email": email,
                "comment_date": timestamp,
                "comment_author_url": author_url,
                "comment_content": msg,
                "Data": data,
            }

    def verify_cookie(self, adone, score, timestamp, msg, author, email,
                      authorURL):
        data = msg + author + email
        checksumData = self.calculate_checksum(msg, author, email, score,
                                               timestamp)
        total = data + self.key + str(score) + timestamp
        cookie = md5(total)
        final = self.key + cookie
        
        return adone in (current
        return md5(self.currentKey + checksum) == adone
    
    def update_key(self, key):
        self.previousKey = self.currentKey
        self.currentKey = key

    def calculate_checksum(self, msg, author, email, score, timestamp):
        checksumData = "{msg}{author}{email}{key}{score}{timestamp}".format(
            msg=msg,
            author=author,
            email=email,
            key=self.currentKey,
            score=score,
            timestamp=timestamp)
        return md5(checksumData)

