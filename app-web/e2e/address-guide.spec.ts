import {test,expect} from '@playwright/test';
test('address guide shows annotated instructions and returns focus',async({page})=>{
 await page.route('**/api/config',r=>r.fulfill({json:{ocr:false,live:{enabled:false}}}));
 await page.goto('/');
 await page.getByRole('button',{name:'Enter details manually'}).click();
 const trigger=page.getByRole('button',{name:'Where do I find this?'});
 await trigger.click();
 const dialog=page.getByRole('dialog',{name:'Find your near.com address'});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('button',{name:'Close address help'})).toBeFocused();
 await expect(dialog.getByRole('heading',{name:'Turn on Confidential Mode'})).toBeVisible();
 await expect(dialog.locator('.address-guide-target')).toHaveCount(5);
 for(const img of await dialog.getByRole('img').all()){
  await img.scrollIntoViewIfNeeded();
  await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
 }
 await dialog.locator('.show-address-guide').scrollIntoViewIfNeeded();
 await page.screenshot({path:`../../outputs/address-guide-${test.info().project.name}.png`});
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 await page.keyboard.press('Escape');
 await expect(dialog).not.toBeVisible();
 await expect(trigger).toBeFocused();
});
