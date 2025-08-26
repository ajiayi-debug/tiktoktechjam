import asyncio
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import json

class SocialMediaScraper:
    def __init__(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in headless mode
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        service = Service()
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
    async def scrape_instagram(self, username):
        try:
            self.driver.get(f"https://www.instagram.com/{username}/")
            # Wait for content to load
            time.sleep(3)
            
            # Get page source after JavaScript renders
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Extract data
            data = {
                'username': username,
                'bio': self._extract_bio(soup),
                'posts': self._extract_recent_posts(soup),
                'metadata': {
                    'followers': self._extract_followers(soup),
                    'following': self._extract_following(soup),
                    'post_count': self._extract_post_count(soup)
                }
            }
            return data
            
        except Exception as e:
            print(f"Error scraping Instagram: {str(e)}")
            return None

    async def scrape_tiktok(self, username):
        try:
            self.driver.get(f"https://www.tiktok.com/@{username}")
            time.sleep(3)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            data = {
                'username': username,
                'bio': self._extract_tiktok_bio(soup),
                'recent_videos': self._extract_tiktok_videos(soup),
                'metadata': {
                    'followers': self._extract_tiktok_followers(soup),
                    'following': self._extract_tiktok_following(soup),
                    'likes': self._extract_tiktok_likes(soup)
                }
            }
            return data
            
        except Exception as e:
            print(f"Error scraping TikTok: {str(e)}")
            return None

    def _extract_bio(self, soup):
        # Implement Instagram bio extraction
        pass

    def _extract_recent_posts(self, soup):
        # Implement Instagram posts extraction
        pass

    def _extract_followers(self, soup):
        # Implement followers extraction
        pass

    def close(self):
        if self.driver:
            self.driver.quit()

async def main():
    scraper = SocialMediaScraper()
    try:
        # Scrape Instagram
        instagram_data = await scraper.scrape_instagram("zermattneo")
        if instagram_data:
            with open("instagram_data.json", "w") as f:
                json.dump(instagram_data, f, indent=2)
        
        # Scrape TikTok
        tiktok_data = await scraper.scrape_tiktok("zermattneo")
        if tiktok_data:
            with open("tiktok_data.json", "w") as f:
                json.dump(tiktok_data, f, indent=2)
                
    finally:
        scraper.close()

if __name__ == "__main__":
    asyncio.run(main())