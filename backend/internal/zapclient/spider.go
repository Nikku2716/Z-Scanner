package zapclient

import (
	"fmt"
	"net/url"
	"strconv"
)

func (c *Client) StartSpider(target string, maxChildren int) (string, error) {
	params := url.Values{}
	params.Set("url", target)
	params.Set("maxChildren", strconv.Itoa(maxChildren))
	params.Set("recurse", "true")
	params.Set("subtreeOnly", "false")

	result, err := c.get("spider/action/scan/", params)
	if err != nil {
		return "", err
	}
	return fmt.Sprint(result["scan"]), nil
}

func (c *Client) SpiderStatus(scanID string) (int, error) {
	params := url.Values{}
	params.Set("scanId", scanID)

	result, err := c.get("spider/view/status/", params)
	if err != nil {
		return 0, err
	}
	status, _ := strconv.Atoi(fmt.Sprint(result["status"]))
	return status, nil
}

func (c *Client) StopSpider(scanID string) error {
	params := url.Values{}
	params.Set("scanId", scanID)
	_, err := c.get("spider/action/stop/", params)
	return err
}
