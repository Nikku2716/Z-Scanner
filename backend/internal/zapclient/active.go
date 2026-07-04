package zapclient

import (
	"fmt"
	"net/url"
	"strconv"
)

func (c *Client) StartActiveScan(target string) (string, error) {
	params := url.Values{}
	params.Set("url", target)
	params.Set("recurse", "true")
	params.Set("inScopeOnly", "false")

	result, err := c.get("ascan/action/scan/", params)
	if err != nil {
		return "", err
	}
	return fmt.Sprint(result["scan"]), nil
}

func (c *Client) ActiveScanStatus(scanID string) (int, error) {
	params := url.Values{}
	params.Set("scanId", scanID)

	result, err := c.get("ascan/view/status/", params)
	if err != nil {
		return 0, err
	}
	status, _ := strconv.Atoi(fmt.Sprint(result["status"]))
	return status, nil
}

func (c *Client) StopActiveScan(scanID string) error {
	params := url.Values{}
	params.Set("scanId", scanID)
	_, err := c.get("ascan/action/stop/", params)
	return err
}
